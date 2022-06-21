//Not sure if this is working how i want it to, super scuffed

var CACHE_NAME = 'SoopyMC-new-tab-cache';
var urlsToCache = [
  'https://swanviewshs.schoolzineplus.com/theme/website/szschool/css/style.css?v=1.0',
  '/images/reload.png',
  '/images/arrow.png',
  '/ntab.js',
  '/ntab2.js',
];
self.addEventListener('activate', function (event) {

  var cacheAllowlist = [CACHE_NAME, 'SoopyMC-platformer-cache', 'site-cache-v1'];

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {


  if (event.request.mode === 'navigate') {
    // See /web/fundamentals/getting-started/primers/async-functions
    // for an async/await primer.
    event.respondWith(async function () {
      // Optional: Normalize the incoming URL by removing query parameters.
      // Instead of https://example.com/page?key=value,
      // use https://example.com/page when reading and writing to the cache.
      // For static HTML documents, it's unlikely your query parameters will
      // affect the HTML returned. But if you do use query parameters that
      // uniquely determine your HTML, modify this code to retain them.
      const normalizedUrl = new URL(event.request.url);
      normalizedUrl.search = '';

      // Create promises for both the network response,
      // and a copy of the response that can be used in the cache.
      const fetchResponseP = fetch(normalizedUrl);
      const fetchResponseCloneP = fetchResponseP.then(r => r.clone());

      // event.waitUntil() ensures that the service worker is kept alive
      // long enough to complete the cache update.
      event.waitUntil(async function () {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(normalizedUrl, await fetchResponseCloneP);
      }());

      // Prefer the cached response, falling back to the fetch response.
      return (await caches.match(normalizedUrl)) || fetchResponseP;
    }());
    return;
  }
  if (event.request.method === 'GET') {
    if (event.request.url.includes("json") || event.request.url.includes("/api") || event.request.url.includes("/soopy")) return;
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          // Cache hit - return response
          if (response) {
            setTimeout(() => {
              fetch(event.request).then(function (response) {

                var responseToCache = response;

                caches.open(CACHE_NAME)
                  .then(function (cache) {
                    cache.put(event.request, responseToCache);
                  });
              })
            }, 5000 + 30000 * Math.random())
            return response;
          }

          return fetch(event.request).then(
            function (response) {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // IMPORTANT: Clone the response. A response is a stream
              // and because we want the browser to consume the response
              // as well as the cache consuming the response, we need
              // to clone it so we have two streams.
              var responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(function (cache) {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        })
    );
  }
});