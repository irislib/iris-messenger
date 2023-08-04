/**
 * `OneCallQueue` is a utility function that ensures only a single invocation of an asynchronous function occurs for a given key at a time.
 *
 * This function uses a cache system to manage the state of calls. When a call is made with a particular key, it checks if there's already a promise in the cache for that key. If so, it returns that promise. If not, it creates a new promise, stores it in the cache, and returns it.
 *
 * Once the promise is resolved or rejected, the key is cleared from the cache, allowing for a new invocation of the function with the same key.
 *
 * This is particularly useful in scenarios where multiple requests can be made to an asynchronous function simultaneously, and you want to prevent redundant calls and ensure that all callers receive the same result.
 *
 * @param {string} key - The unique identifier for the function call. Simultaneous calls with the same key will be queued.
 * @param {OneCallQueueFn} call - The async function that should be invoked.
 * @returns {Promise<T>} - The promise that resolves with the result of the async function. If the function is already in progress with the same key, this will be the promise for that invocation.
 */
let cache: Record<string, Promise<any>> = {};

export type OneCallQueueFn = () => Promise<any>;

export default async function OneCallQueue<T>(key: string, call: OneCallQueueFn): Promise<T> {
  if (!cache[key]) {
    // If a promise is not in the cache, create a new one.
    cache[key] = call().finally(() => {
      // Once the promise has settled, remove it from the cache.
      delete cache[key];
    });
  }

  return cache[key];
}
