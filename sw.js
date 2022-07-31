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

	return response;
}

self.addEventListener("fetch", (event) => {
	event.respondWith(fetchRe(event));
});

})();
