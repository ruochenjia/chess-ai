

const engines = {
	stockfish: {
		init: async () => {
			// native module
			if (typeof window.stockfish != "undefined")
				return window.stockfish;
			
			// wasm module
			let script = document.createElement("script");
			if (typeof SharedArrayBuffer == "undefined") {
				script.src = "lib/stockfish/singlethread/stockfish.js";
				console.warn("SharedArrayBuffer is not supported");
			} else script.src = "lib/stockfish/stockfish.js";
			script.type = "text/javascript";
			script.async = true;
			document.getElementsByTagName("head")[0].appendChild(script);
			await new Promise(resolve => {
				script.onload = resolve;
			});
			return await Stockfish();
		}
	}
};

function UCIEngine() {
	let base = null;

	/**
	 * @param {String} name 
	 */
	this.init = async (name) => {
		base = await engines[name].init();
	};

	/**
	 * @returns {String | null}
	 */
	this.read = () => {
		return base.message();
	};

	/**
	 * @param {String} text 
	 */
	this.write = (text) => {
		base.postMessage(text);
	};

	/**
	 * @param {String} text 
	 * @returns {Promise<String>}
	 */
	this.grep = (text) => {
		return new Promise(resolve => {
			let timer = setInterval(() => {
				let msg = this.read();
				if (msg != null && msg.includes(text)) {
					clearInterval(timer);
					resolve(msg);
				}
			}, 30);
		});
	};
}

export { UCIEngine };
