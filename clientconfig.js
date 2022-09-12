const clientConfig = {
	server: "https://a54.chesscheta.gq/",
	debug: true,
	cacheName: "chesscheta",
	cacheVersion: "0.2.3-preview1",
	cacheList: [],
	headers: {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET",
		"Access-Control-Allow-Credentials": "true",
		//"Cross-Origin-Embedder-Policy": "require-corp",
		//"Cross-Origin-Opener-Policy": "same-origin",
		"Referrer-Policy": "origin-when-cross-origin",
		"X-Content-Type-Options": "nosniff",

		// cross origin isolation is disabled due to issues with Google OAuth

		// localhost
		//"Origin-Trial": "Aps6uq8O8LqzQimmnNFmI/CKH6Cny5U3wqzK/g/WyHzMxLKbcadjH/QNDXRjkzm2C0yBZaWQkAC63a85Lpw9TgkAAABeeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwIiwiZmVhdHVyZSI6IlVucmVzdHJpY3RlZFNoYXJlZEFycmF5QnVmZmVyIiwiZXhwaXJ5IjoxNjc1Mjk1OTk5fQ==",
		// remote domain 1
		"Origin-Trial": "AksCngS59Ne+5fhkyTHSl83Axqxw/Rlg3gPigUUbVgU9Ia/L44mMEaKx4o4By3khKtZECBwi9QlPlSr9kR9ASgsAAAB3eyJvcmlnaW4iOiJodHRwczovL2NoZXNzY2hldGEuZ3E6NDQzIiwiZmVhdHVyZSI6IlVucmVzdHJpY3RlZFNoYXJlZEFycmF5QnVmZmVyIiwiZXhwaXJ5IjoxNjc1Mjk1OTk5LCJpc1N1YmRvbWFpbiI6dHJ1ZX0="
		// remote domain 2
		//"Origin-Trial": "AjoAS5ATashGr7V2TQpSHhBWyE1pxp52aX0LuWfITri+K4eRVihsDpviIUCiUUMK10VOaBnwEEo9gT0QPLd26wYAAAB0eyJvcmlnaW4iOiJodHRwczovL2NoZXNzY2hldGEucnVvY2hlbmppYS5yZXBsLmNvOjQ0MyIsImZlYXR1cmUiOiJVbnJlc3RyaWN0ZWRTaGFyZWRBcnJheUJ1ZmZlciIsImV4cGlyeSI6MTY3NTI5NTk5OX0=",

		//"X-Frame-Options": "SAMEORIGIN"
	}
};

export { clientConfig };
