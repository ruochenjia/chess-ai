

function verifyHex(...args) {
	for (let s of args) {
		let n = parseInt(s, 16);
		if (!verifyNumber(n))
			return false;
	}
	return true;
}

/**
 * @param {Number} n 
 */
function verifyNumber(n) {
	return n >= 0 && n <= 255;
}

/**
 * @returns {Number | null}
 */
function parseValue(v) {
	switch (typeof v) {
		case "number":
			return verifyNumber(v) ? v : null;
		case "string":
			return parseInt(v, 16);
		case "object":
			return v == null ? null : parseValue(v.valueOf());
		default:
			return null;
	}
}

/**
 * @param {Number} n 
 */
function toHex(n) {
	let s = n.toString(16);
	if (s.length == 1)
		return "0" + s;
	else return s;
}

class ColorCode {
	/**
	 * @param {String | Number | undefined} r 
	 * @param {String | Number | undefined} g 
	 * @param {String | Number | undefined} b 
	 * @param {String | Number | undefined} a 
	 */
	constructor(r, g, b, a) {
		this.a = a;
		this.r = r;
		this.g = g;
		this.b = b;
	}

	/**
	 * @param {String} code 
	 */
	static parse(code) {
		let codeArr = Array.from(code);

		switch (codeArr.length) {
			// rgb
			case 7:
				if (codeArr.shift() != "#")
					return null;
			case 6: {
				let r = codeArr[0] + codeArr[1];
				let g = codeArr[2] + codeArr[3];
				let b = codeArr[4] + codeArr[5];
				if (!verifyHex(r, g, b))
					return null;
				return new ColorCode(r, g, b);
			}

			// argb
			case 9:
				if (codeArr.shift() != "#")
					return null;
			case 8: {
				let a = codeArr[0] + codeArr[1];
				let r = codeArr[2] + codeArr[3];
				let g = codeArr[4] + codeArr[5];
				let b = codeArr[6] + codeArr[7];
				if (!verifyHex(a, r, g, b))
					return null;

				return new ColorCode(r, g, b, a);
			}

			// invalid
			default:
				return null;
		}
	}

	/**
	 * @param {String | Number | undefined} r 
	 * @param {String | Number | undefined} g 
	 * @param {String | Number | undefined} b 
	 */
	static rgb(r, g, b) {
		return new ColorCode(r, g, b);
	}

	/**
	 * @param {String | Number | undefined} r 
	 * @param {String | Number | undefined} g 
	 * @param {String | Number | undefined} b 
	 * @param {String | Number | undefined} a 
	 */
	static rgba(r, g, b, a) {
		return new ColorCode(r, g, b, a);
	}

	/**
	 * @param {String | Number | undefined} a 
	 * @param {String | Number | undefined} r 
	 * @param {String | Number | undefined} g 
	 * @param {String | Number | undefined} b 
	 */
	static argb(a, r, g, b) {
		return new ColorCode(r, g, b, a);
	}

	get a() {
		return this._a;
	}

	get r() {
		return this._r;
	}

	get g() {
		return this._g;
	}

	get b() {
		return this._b;
	}

	set a(v) {
		let val = parseValue(v);
		if (val != null) {
			this._a = val;
		}
	}

	set r(v) {
		let val = parseValue(v);
		if (val != null)
			this._r = val;
	}

	set g(v) {
		let val = parseValue(v);
		if (val != null)
			this._g = val;
	}

	set b(v) {
		let val = parseValue(v);
		if (val != null)
			this._b = val;
	}

	get cssString() {
		if (this._a == 0xff) // rgb
			return "#" + toHex(this._r) + toHex(this._g) + toHex(this._b);
		else // rgba
			return `rgba(${this._r}, ${this._g}, ${this._b}, ${this._a / 255})`;
	}

	toString() {
		if (this._a == 0xff) // rgb
			return "#" + toHex(this._r) + toHex(this._g) + toHex(this._b);
		else // argb
			return "#" + toHex(this._a) + toHex(this._r) + toHex(this._g) + toHex(this._b);
	}

	toJSON() {
		return this.toString();
	}

	clone() {
		let obj = new ColorCode();
		obj._a = this._a;
		obj._r = this._r;
		obj._g = this._g;
		obj._b = this._b;
		return obj;
	}

	// private values
	_a = 0xff;
	_r = 0;
	_g = 0;
	_b = 0;
}

export { ColorCode };
