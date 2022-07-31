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
			headers.set("Cross-Origin-Opener-Policy", "same-origin");
			headers.set("Cross-Origin-Embedder-Policy", "require-corp");
			return headers;
		})()
	});
}

self.addEventListener("fetch", (event) => {
	event.respondWith(fetchRe(event));
});

})();
