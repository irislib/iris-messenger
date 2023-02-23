import { getFiles, setupPrecaching, setupRouting } from 'preact-cli/sw';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
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
registerRoute(
  ({ url }) => url.pathname === '/',
  new StaleWhileRevalidate({
    cacheName: 'iris-main',
  }),
);
registerRoute(
  ({ url }) => url.pathname === '/' || url.pathname.startsWith('/.well-known/nostr.json'),
  new NetworkFirst({
    networkTimeoutSeconds: 5,
    cacheName: 'iris-network-first',
  }),
);
registerRoute(
  ({ url }) => {
    return location.host.indexOf('localhost') !== 0 && url.origin === self.location.origin;
  },
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(({ url }) => url.href.startsWith('https://api.iris.to/user/'), new NetworkOnly());

registerRoute(
  ({ url }) => url.href.startsWith('https://api.iris.to/'),
  new CacheFirst({
    cacheName: 'iris-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 1 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.href.startsWith('https://imgproxy.iris.to/insecure/rs:fill:'),
  new CacheFirst({
    cacheName: 'scaled-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// cache remote assets with limit and expiration time
registerRoute(
  ({ url }) => url.origin !== self.location.origin,
  new CacheFirst({
    cacheName: 'remote-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

setupRouting();

const urlsToCache = getFiles();
setupPrecaching(urlsToCache);
