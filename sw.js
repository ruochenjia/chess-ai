"use strict";

(() => {
// SERVICE WORKER
importScripts("/app.js");

let cacheName =  new URL(location).hostname + app.id + app.version;

async function install() {
	let cache = await caches.open(cacheName);
	await cache.addAll(app.fileList);
}

// do not remove the prefix '_' of this function
// otherwise it will override the default fetch function
async function _fetch({ request }) {
	let response = await caches.match(request);
	if (response == null) {
		response = await fetch(request);
		let cache = await caches.open(cacheName);
		cache.put(request, response.clone());	
	}
	return response;
}

self.addEventListener("install", (event) => {
	event.waitUntil(install());
});

self.addEventListener("update", (event) => {
	event.waitUntil(install());
});

self.addEventListener("fetch", (event) => {
	event.respondWith(_fetch(event));
});


})();
