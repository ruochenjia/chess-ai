"use strict";

(() => {

interface ButtonConfig {
	text? : string;
	disabled? : boolean;
	onclick? : () => any;
}

interface InputConfig {
	type? : string;
	placeholder? : string;
	value? : string;
}

interface DialogConfig {
	title? : string;
	message? : string;
	width? : number;
	positiveButton? : ButtonConfig;
	negativeButton? : ButtonConfig;
	neutralButton? : ButtonConfig;
	input?: InputConfig;
	customView? : string;
}

let baseUrl = (() => {	
	let base = new URL((document.currentScript as HTMLScriptElement).src).href;
	return base.substring(0, base.lastIndexOf("/") + 1);
})();

function fallback<E>(a : E, b : E) : E {
	if (a == null)
		return b;
	return a;
}

function waitForBody() : Promise<HTMLElement> {
	return new Promise(resolve => {
		let body = document.body;
		if (body == null) {
			document.addEventListener("DOMContentLoaded", () => {
				resolve(document.body);
			});
		}
		resolve(body);
	});
}

function createFrame() {
	let frame = document.createElement("iframe");
	frame.setAttribute("type", "text/plain");
	frame.setAttribute("width", "1024");
	frame.setAttribute("height", "768");
	frame.setAttribute("style", "position:absolute;display:block;width:100%;height:100%;top:0px;left:0px;right:0px;bottom:0px;border:none;");
	frame.setAttribute("scrolling", "no");
	frame.setAttribute("loading", "eager");
	frame.setAttribute("allowfullscreen", "true");
	frame.setAttribute("allowtransparency", "true");
	frame.setAttribute("fetchpriority", "high");
	return frame;
}

function initButton(config : ButtonConfig | undefined, element : HTMLElement) {
	if (config != null) {
		element.innerHTML = fallback(config.text, null)!;
		if (fallback(config.disabled, false))
			element.setAttribute("disabled", "true");
		else element.onclick = config.onclick as any;
	} else element.remove();
}

async function fetchDoc(url : string) {
	let response = await fetch(new Request(url, {
		method: "GET",
		headers: {}
	}));

	if (!response.ok)
		throw `Failed to fetch ${url}, status: ${response.status} ${response.statusText}`;

	return await response.text();
}

class BaseDialog {
	show: () => Promise<void>;
	close: () => void;
	dismiss: () => void;
	cancel: () => void;
	inputElement : HTMLInputElement;
	viewElement : HTMLElement;

	constructor(cfg : DialogConfig) {
		let config = fallback(cfg, {});
		let currentFrame : HTMLIFrameElement | null = null;

		this.show = async () => {
			let frame = createFrame();
			let body = await waitForBody();
			let htmlDoc = await fetchDoc(`${baseUrl}dialog.html`);

			htmlDoc = htmlDoc.replace("${baseURL}", baseUrl);
			frame.setAttribute("srcdoc", htmlDoc);
			body.style.overflow = "hidden";
			body.appendChild(frame);
			await new Promise(resolve => {
				frame.onload = resolve;
			});

			let win = frame.contentWindow!;
			let doc = frame.contentDocument!;

			let width = config.width;
			if (width != null)
				doc.getElementById("dialog")!.style.width = config.width + "px";

			let title = fallback(config.title, "")!;
			let titleEl = doc.getElementById("title")!;
			if (title.length > 0)
				titleEl.innerHTML = title;
			else titleEl.remove();

			let message = fallback(config.message, "")!;
			let messageEl = doc.getElementById("message")!;
			if (message.length > 0)
				messageEl.innerHTML = message;
			else messageEl.remove();

			let input = config.input;
			let inputEl = doc.getElementById("input") as HTMLInputElement;
			if (input != null) {
				inputEl.type = fallback(input.type, "text")!;
				inputEl.placeholder = fallback(input.placeholder, "")!;
				inputEl.value = fallback(input.value, "")!;
				this.inputElement = inputEl;
			} else inputEl.remove();

			let customView = config.customView;
			let customViewEl = doc.getElementById("custom-view")!;
			if (customView != null) {
				customViewEl.innerHTML = customView;
				this.viewElement = customViewEl;
			}
			else customViewEl.remove();

			initButton(config.positiveButton, doc.getElementById("positive-button")!);
			initButton(config.negativeButton, doc.getElementById("negative-button")!);
			initButton(config.neutralButton, doc.getElementById("neutral-button")!);

			currentFrame = frame;
		};

		this.close = this.dismiss = this.cancel = () => {
			if (currentFrame != null) {
				// unlock scrolling
				document.body.style.overflow = "";

				currentFrame.remove();
				currentFrame = null;
			}
		};
	}
}

class Dialog extends BaseDialog {
	constructor(config : DialogConfig) {
		super(config);
	}
}

let alert = (message? : string, title? : string) => {
	let dialog = new Dialog({
		message: message,
		title: title,
		positiveButton: {
			text: "OK",
			onclick: () => dialog.dismiss()
		}
	});
	dialog.show();
};


let confirm = (message? : string, title? : string): Promise<boolean> => {
	return new Promise(resolve => {
		let dialog = new Dialog({
			message: message,
			title: title,
			positiveButton: {
				text: "OK",
				onclick: () => {
					resolve(true);
					dialog.dismiss();
				}
			},
			negativeButton: {
				text: "Cancel",
				onclick: () => {
					resolve(false);
					dialog.cancel();
				}
			}
		});
		dialog.show();
	});
};

let prompt = (message? : string, defaultValue? : string, title? : string): Promise<string | null> => {
	return new Promise(resolve => {
		let dialog = new Dialog({
			message: message,
			title: title,
			input: {
				type: "text",
				placeholder: defaultValue,
				value: defaultValue
			},
			positiveButton: {
				text: "OK",
				onclick: () => {
					resolve(dialog.inputElement.value);
					dialog.dismiss();
				}
			},
			negativeButton: {
				text: "Cancel",
				onclick: () => {
					resolve(null);
					dialog.cancel();
				}
			}
		});
		dialog.show().then(() => {
			dialog.inputElement.onkeydown = (e) => {
				if (e.keyCode == 13) { // enter
					e.preventDefault();
					resolve((e.target as any).value);
					dialog.dismiss();
				}
			};
		});
	});
};

let webAlert = {
	Dialog,
	alert,
	confirm,
	prompt
};

let win = window as any;

win.nativeAlert = window.alert;
win.nativeConfirm = window.confirm;
win.nativePrompt = window.prompt;
win.alert = alert;
win.confirm = confirm;
win.prompt = prompt;
win.webAlert = webAlert;

})();
