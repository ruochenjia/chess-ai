"use strict";

(() => {
// SERVICE WORKER

const cacheName =  self.location.hostname + "-" + "whitespider-chess-ai";
const headStr = `Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Allow-Chrome: false`;

async function fetchRe({ request }) {
	let response = await caches.match(request);
	if (response == null) {
		response = await fetch(request);
		(await caches.open(cacheName)).put(request, response.clone());
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: (() => {
			let headers = new Headers();
			for (let h of response.headers.entries())
				headers.append(h[0], h[1]);

			let ah = headStr.split("\n");
			for (let h of ah) {
				h = h.split(": ");
				headers.append(h[0], h[1]);
			}

			return headers;
		})()
	});
}

self.addEventListener("fetch", (event) => {
	event.respondWith(fetchRe(event));
});

})();
