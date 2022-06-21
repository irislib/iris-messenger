import Gun from 'gun';
import 'gun/lib/text-encoding';
import 'gun/sea';
import localforage from './js/lib/localforage.min';
import { getFiles, setupPrecaching, setupRouting } from 'preact-cli/sw';
import { registerRoute } from 'workbox-routing';
import {StaleWhileRevalidate, NetworkOnly} from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const bgSyncPlugin = new BackgroundSyncPlugin('apiRequests', {
	maxRetentionTime: 14 * 24 * 60
});

registerRoute(
	'https://iris-notifications.herokuapp.com/notify',
	new NetworkOnly({
		plugins: [bgSyncPlugin]
	}),
	'POST'
);
registerRoute(
	'/peer_id',
	new NetworkOnly()
);
registerRoute(
  () => true,
  new StaleWhileRevalidate()
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

self.onmessage = function(msg) {
  if (Object.prototype.hasOwnProperty.call(msg, 'key')) {
    self.irisKey = msg.data.key;
    localforage.setItem('swIrisKey', self.irisKey);
  }
}

function getOpenClient(event) {
  return new Promise(resolve => {
    event.waitUntil(
      self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          let client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) return resolve(client);
        }
        resolve(null);
      })
    );
  });
}

self.addEventListener('push', async ev => {
  const client = await getOpenClient(ev);
  if (client && client.visibilityState === 'visible') return;
  if (!self.irisKey) {
    await getSavedKey();
  }
  const data = ev.data.json();
  if (!data.title || !data.body) {
    console.log('what?', data);
  }
  if (self.irisKey && data.from && data.from.epub) {
    const secret = await Gun.SEA.secret(data.from.epub, self.irisKey);
    data.title = await Gun.SEA.decrypt(data.title, secret);
    data.body = await Gun.SEA.decrypt(data.body, secret);
  }
  if (data.title && data.title.indexOf('SEA{') === 0) {
    data.title = '';
    data.body = 'Encrypted message';
  }
  self.registration.showNotification(data.title || 'No title', {
    body: data.body || 'No text',
    icon: '/assets/img/icon128.png'
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
