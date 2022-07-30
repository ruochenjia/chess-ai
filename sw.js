"use strict";

(() => {
// SERVICE WORKER

const cacheName =  self.location.hostname + "-" + "whitespider-chess-ai";

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
			let headers = new Headers(response.headers);
			// same as _headers file
			headers.set("Referrer-Policy", "no-referrer")
			headers.set("X-Content-Type-Options", "nosniff");
			headers.set("X-Frame-Options", "SAMEORIGIN");
			headers.set("Cross-Origin-Opener-Policy", "same-origin");
			headers.set("Cross-Origin-Embedder-Policy", "require-corp");
			headers.set("Allow-Chrome", "false");
			return headers;
		})()
	});
}

self.addEventListener("fetch", (event) => {
	event.respondWith(fetchRe(event));
});

})();
