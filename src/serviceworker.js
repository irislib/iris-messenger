var CACHE_NAME = 'iris-messenger-cache-v1';
var urlsToCache = [
  './',
  'css/style.css',
  'css/cropper.min.css',
  'img/android-chrome-192x192.png',
  'img/android-chrome-512x512.png',
  'img/apple-touch-icon.png',
  'img/favicon-16x16.png',
  'img/favicon-32x32.png',
  'img/icon128.png',
  'img/mstil-150x150.png',
  'img/safari-pinned-tab.svg',
  'js/app.js',
  'js/Autolinker.min.js',
  'js/cropper.min.js',
  'js/emoji-button.js',
  'js/gun.js',
  'js/helpers.js',
  'js/irisLib.js',
  'js/jquery.js',
  'js/nts.js',
  'js/pica.min.js',
  'js/qrcode.min.js',
  'js/sea.js',
  'js/underscore-min.js',
  'browserconfig.xml',
  'favicon.ico',
  'index.html',
  'notification.mp3',
  'site.webmanifest'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(err) {
        console.error('Caching error', err);
      })
  );
});

function fetchAndUpdate(request) {
  return fetch(request).then(
    function(response) {
      // Check if we received a valid response
      if(!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // IMPORTANT: Clone the response. A response is a stream
      // and because we want the browser to consume the response
      // as well as the cache consuming the response, we need
      // to clone it so we have two streams.
      var responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(function(cache) {
          cache.put(request, responseToCache);
        });

      return response;
    }
  );
}

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (self.location.host.indexOf('localhost') === 0) {
          console.log('not sw caching localhost');
        }
        else if (response) {
          console.log('cache hit', event.request);
          fetchAndUpdate(event.request);
          return response;
        }

        return fetchAndUpdate(event.request);
      })
    );
});
