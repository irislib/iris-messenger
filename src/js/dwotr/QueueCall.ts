let cache = {};

export type QueueCallFn = () => Promise<any>;

// Queue calls to the same async function, so that only one call is to the QueueCallFn.
// When the original Promise eventually resolves or rejects, all attached handlers will be called. 
export default async function QueueCall<T>(key: string, call : QueueCallFn) : Promise<T> {
  if (cache[key]) {
    // If a promise is already in the cache, return it.
    return cache[key];
  }

  // If a promise is not in the cache, create a new one.
  const promise = new Promise<T>(async (resolve, reject) => {
    try {
      const data = await call() as T;
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });

  // Store the promise in the cache.
  cache[key] = promise;

  // Wait for the promise to resolve or reject.
  const result = await promise;

  // Once the promise has settled, remove it from the cache.
  cache[key] = undefined;

  return result;
}