const window = self;
self.importScripts('js/lib/gun.js', 'js/lib/sea.js', 'js/lib/localforage.min.js');
var CACHE_NAME = 'iris-messenger-cache-v1';

localforage.getItem('swIrisKey', (err, val) => {
  self.irisKey = (self.irisKey || JSON.parse(val));
});

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
    localforage.setItem('swIrisKey', JSON.stringify(self.irisKey));
  }
}

self.addEventListener('push', async ev => {
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

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn't close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
