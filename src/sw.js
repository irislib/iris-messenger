import { getFiles, setupPrecaching, setupRouting } from 'preact-cli/sw';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';

const bgSyncPlugin = new BackgroundSyncPlugin('apiRequests', {
  maxRetentionTime: 14 * 24 * 60,
});

const assetUrls = getFiles();

// Never cache POST requests
registerRoute(
  ({ request }) => request.method === 'POST',
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
);

// Make root page load instantly, even if offline. Tradeoff: after app update, user will see old version until they refresh.
registerRoute(
  ({ url }) => url.pathname === '/',
  new NetworkFirst({
    cacheName: 'iris-main',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // no 404
      }),
    ],
  }),
);

// Nip05 lookups cache first
registerRoute(
  ({ url }) => url.pathname.startsWith('/.well-known/nostr.json'),
  new CacheFirst({
    networkTimeoutSeconds: 5,
    cacheName: 'iris-nip05',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 1 * 60 * 60, // 1 hour
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// Page urls like iris.to/username are often stale and should be updated.
// Could we serve the already cached and updated / for them?
// This also catches everything else from current site
registerRoute(
  ({ url }) => {
    return (
      self.location.host.indexOf('localhost') !== 0 &&
      url.origin === self.location.origin &&
      !assetUrls.includes(url.pathname) // these are cached later by setupPrecaching
    );
  },
  new NetworkFirst({
    cacheName: 'pages-etc',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// Iris.to user account requests should not be cached
registerRoute(({ url }) => url.href.startsWith('https://api.iris.to/user/'), new NetworkOnly());

// Iris.to /events and /profiles requests should be cached
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

// Cache scaled images from proxy
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

// Cache full-size images, videos and other remote assets with limit and expiration time
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

setupPrecaching(assetUrls);
