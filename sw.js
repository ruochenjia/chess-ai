import { clientConfig } from "./clientconfig.js";

const cacheName =  `${self.location.hostname}-${clientConfig.cacheName}-${clientConfig.cacheVersion}`;

async function install() {
	let cache = await caches.open(cacheName);
	await cache.addAll(clientConfig.cacheList);
}

async function cache(request, response) {
	// cross origin responses
	if (response.status == 0)
		return;

	try {
		let cache = await caches.open(cacheName);
		await cache.put(request, response.clone());
	} catch(err) {
		// ignore - this is usually caused by an unsupported request method
	}
}

async function fetchRe({ request }) {
	let response = await caches.match(request);
	if (response == null) {
		response = await fetch(request);
		cache(request, response);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: (() => {
			let head = new Headers(response.headers);
			for (let e of Object.entries(clientConfig.headers))
				head.set(e[0], e[1]);
			return head;
		})()
	});
}

async function removeOldCaches() {
	for (let k of await caches.keys()) {
		if (k != cacheName)
			await caches.delete(k);
	}
}

self.addEventListener("install", (event) => {
	event.waitUntil(install());
});

self.addEventListener("fetch", (event) => {
	event.respondWith(fetchRe(event));
});

self.addEventListener("activate", (event) => {
	event.waitUntil(removeOldCaches());
});
