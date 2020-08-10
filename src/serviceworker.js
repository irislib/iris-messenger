const window = self;
const urlToOpen = new URL('/', self.location.origin).href;
self.importScripts('js/lib/gun.js', 'js/lib/sea.js', 'js/lib/localforage.min.js');
var CACHE_NAME = 'iris-messenger-cache-v1';

async function getSavedKey() {
  try {
    self.irisKey = await localforage.getItem('swIrisKey');
  } catch (err) {
    console.error('error loading iris key', err);
  }
  return self.irisKey;
}

// stale-while-revalidate
if (self.location.host.indexOf('localhost') !== 0) {
  self.addEventListener('fetch', function(event) {
    if (event.request && event.request.method !== 'GET') { return; }
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(response) {
          var fetchPromise = fetch(event.request).then(function(networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          return response || fetchPromise;
        })
      })
    );
  });
}

self.onmessage = function(msg) {
  if (msg.data.hasOwnProperty('key')) {
    self.irisKey = msg.data.key;
    localforage.setItem('swIrisKey', self.irisKey);
  }
}

function getOpenClient(event) {
  return new Promise(resolve => {
    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) return resolve(client);
        }
        resolve(null);
      })
    );
  });
}

self.addEventListener('push', async ev => {
  if (!self.irisKey) {
    await getSavedKey();
  }
  const data = ev.data.json();
  if (self.irisKey && data.from && data.from.epub) {
    const secret = await Gun.SEA.secret(data.from.epub, self.irisKey);
    data.title = await Gun.SEA.decrypt(data.title, secret);
    data.body = await Gun.SEA.decrypt(data.body, secret);
  }
  if (data.title.indexOf('SEA{') === 0) {
    data.title = '';
    data.body = 'Encrypted message';
  }
  self.registration.showNotification(data.title || 'No title', {
    body: data.body || 'No text',
    icon: './img/icon128.png'
  });
});

self.addEventListener('notificationclick', async function(event) {
  // Android doesn't close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  const client = await getOpenClient(event);
  if (client) {
    client.focus();
  } else {
    clients.openWindow && clients.openWindow(urlToOpen);
  }
});
