"use strict";

(() => {
// SERVICE WORKER

let cacheName =  self.location.hostname + "-" + "whitespider-chess-ai";

async function fetchRe({ request }) {
	let response = await caches.match(request);
	if (response == null) {
		response = await fetch(request);
		(await caches.open(cacheName)).put(request, response.clone());
	}

	response.headers.append("Referrer-Policy", "no-referrer");
	response.headers.append("X-Content-Type-Options", "nosniff");
	response.headers.append("Cross-Origin-Opener-Policy", "same-origin");
	response.headers.append("Cross-Origin-Embedder-Policy", "require-corp");
	return response;
}

self.addEventListener("fetch", (event) => {
	event.respondWith(fetchRe(event));
});

})();
