self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Pagina-afbeeldingen, HTML, manifest en service worker:
  // nooit uit Cache Storage halen.
  if (
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/pages/")
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
    );
  }
});
