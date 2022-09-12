

class CSSRuleHolder {
	/**
	 * @type {number}
	 */
	length;

	/**
	 * @type {(index : number) => CSSStyleRule}
	 */
	at;

	/**
	 * @type {(selector : string) => CSSStyleRule}
	 */
	get;

	/**
	 * @param {(add : (obj : CSSStyleRule) => void) => void} callback 
	 */
	constructor(callback) {
		const arr = [];
		const sorted = {};

		let add = (obj) => {
			arr.push(obj);
			sorted[obj.selectorText] = obj;
		};
		callback(add);

		Object.defineProperty(this, "length", {
			get() {
				return arr.length;
			}
		});

		Object.defineProperty(this, "at", {
			writable: false,
			enumerable: false,
			configurable: false,
			value: (i) => arr[i]
		});

		Object.defineProperty(this, "get", {
			writable: false,
			enumerable: false,
			configurable: false,
			value: (i) => sorted[i]
		});
	}
}

function initCssRules() {
	let add;
	let rules = new CSSRuleHolder(a => add = a);

	for (let s of document.styleSheets) {
		try {
			for (let r of s.cssRules)
				add(r);
		} catch (err) { //ignore
		}
	}

	return rules;
}

const cssRules = initCssRules();

export const css = {
	get rules() {
		return cssRules;
	}
};
