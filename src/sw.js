import SEA from 'gun/sea';
import localforage from 'localforage';
import { getFiles, setupPrecaching, setupRouting } from 'preact-cli/sw';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';

const bgSyncPlugin = new BackgroundSyncPlugin('apiRequests', {
  maxRetentionTime: 14 * 24 * 60,
});

registerRoute(
  ({ request }) => request.method === 'POST',
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
);
registerRoute(({ url }) => url.pathname === '/', new NetworkFirst());
registerRoute(({ url }) => {
  return location.host.indexOf('localhost') !== 0 && url.origin === self.location.origin;
}, new StaleWhileRevalidate());

// cache remote assets with limit and expiration time
registerRoute(
  ({ url }) => url.origin !== self.location.origin,
  new CacheFirst({
    cacheName: 'remote-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

setupRouting();

const urlsToCache = getFiles();
setupPrecaching(urlsToCache);

const urlToOpen = new URL('/', self.location.origin).href;

async function getSavedKey() {
  try {
    self.irisKey = await localforage.getItem('swIrisKey');
  } catch (err) {
    console.error('error loading iris key', err);
  }
  return self.irisKey;
}

self.addEventListener('message', (msg) => {
  //console.log('sw got postMessage from client', msg);
  if (msg.data && msg.data.key) {
    self.irisKey = msg.data.key;
    localforage.setItem('swIrisKey', self.irisKey);
  }
});

function getOpenClient(event) {
  return new Promise((resolve) => {
    event.waitUntil(
      self.clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (let i = 0; i < clientList.length; i++) {
            let client = clientList[i];
            return resolve(client);
          }
          resolve(null);
        }),
    );
  });
}

self.addEventListener('push', async (ev) => {
  console.log('Got push', ev);
  if (!self.irisKey) {
    await getSavedKey();
  }
  const data = ev.data.json();
  if (!data.title || !data.body) {
    console.log('what?', data);
  }
  const client = await getOpenClient(ev);
  const fromSelf = (data.from && data.from.pub) === self.irisKey.pub; // always allow notifs from self
  if (!fromSelf && client && client.visibilityState === 'visible') return;
  //console.log(self.irisKey, data.from, data.from.epub);
  if (self.irisKey && data.from && data.from.epub && SEA) {
    // TODO we should also do a signature check here
    const secret = await SEA.secret(data.from.epub, self.irisKey);
    data.title = await SEA.decrypt(data.title, secret);
    data.body = await SEA.decrypt(data.body, secret);
  }
  if (data.title && data.title.indexOf('SEA{') === 0) {
    data.title = '';
    data.body = 'Encrypted message';
  }
  self.registration.showNotification(data.title || 'No title', {
    body: data.body || 'No text',
    icon: '/assets/img/icon128.png',
  });
});

self.addEventListener('notificationclick', async (event) => {
  // Android doesn't close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  const client = await getOpenClient(event);
  if (client) {
    client.focus();
  } else {
    self.clients.openWindow && self.clients.openWindow(urlToOpen);
  }
});
