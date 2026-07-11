const CACHE_NAME = "zero-sutra-runtime-v1";

self.addEventListener("install", () => {
  // Nieuwe service worker niet laten wachten.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Alle oude caches verwijderen.
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),

      // Meteen alle geopende pagina’s overnemen.
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  // Alleen bestanden van je eigen website behandelen.
  if (url.origin !== self.location.origin) {
    return;
  }

  const mustAlwaysBeFresh =
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/pages/");

  if (mustAlwaysBeFresh) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Overige bestanden, zoals iconen: ook online controleren,
  // met cache als offline reserve.
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const freshResponse = await fetch(request, {
      cache: "no-store"
    });

    if (freshResponse && freshResponse.ok) {
      await cache.put(request, freshResponse.clone());
    }

    return freshResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}
