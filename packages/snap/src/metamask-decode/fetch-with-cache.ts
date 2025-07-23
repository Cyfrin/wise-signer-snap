import localforage from 'localforage';
import { memoize } from 'lodash';

export const MILLISECOND = 1;
export const SECOND = MILLISECOND * 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

/**
 *
 * @param key
 */
export async function getStorageItem(key: any) {
  try {
    const serializedData = await localforage.getItem(key);
    if (serializedData === null) {
      return undefined;
    }
    // @ts-ignore
    return JSON.parse(serializedData);
  } catch (err) {
    return undefined;
  }
}

/**
 *
 * @param key
 * @param value
 */
export async function setStorageItem(key: any, value: any) {
  try {
    const serializedData = JSON.stringify(value);
    await localforage.setItem(key, serializedData);
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Returns a function that can be used to make an HTTP request but timing out
 * automatically after a desired amount of time.
 *
 * @param timeout - The number of milliseconds to wait until the request times
 * out.
 * @returns A function that, when called, returns a promise that either resolves
 * to the HTTP response object or is rejected if a network error is encountered
 * or the request times out.
 */
const getFetchWithTimeout = memoize((timeout = SECOND * 30) => {
  if (!Number.isInteger(timeout) || timeout < 1) {
    throw new Error('Must specify positive integer timeout.');
  }

  return async function fetchWithTimeout(
    url: RequestInfo,
    opts?: RequestInit,
  ): Promise<Response> {
    const abortController = new window.AbortController();

    // Add the provided signal to the list of signals that can abort the request
    const abortSignals = [abortController.signal];
    if (opts?.signal) {
      abortSignals.push(opts.signal);
    }

    const combinedAbortController = new AbortController();
    const abortHandler = () => combinedAbortController.abort();
    abortSignals.forEach((sig) => sig.addEventListener('abort', abortHandler));

    const f = window.fetch(url, {
      ...opts,
      signal: combinedAbortController.signal,
    });

    const timer = setTimeout(() => abortController.abort(), timeout);

    try {
      return await f;
    } finally {
      clearTimeout(timer);
      abortSignals.forEach((sig) =>
        sig.removeEventListener('abort', abortHandler),
      );
    }
  };
});

const fetchWithCache = async ({
  url,
  fetchOptions = {},
  cacheOptions: { cacheRefreshTime = MINUTE * 6, timeout = SECOND * 30 } = {},
  functionName = '',
  allowStale = false,
}: {
  url: string;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973

  fetchOptions?: Record<string, any>;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973

  cacheOptions?: Record<string, any>;
  functionName: string;
  allowStale?: boolean;
}) => {
  if (
    fetchOptions.body ||
    (fetchOptions.method && fetchOptions.method !== 'GET')
  ) {
    throw new Error('fetchWithCache only supports GET requests');
  }
  if (!(fetchOptions.headers instanceof window.Headers)) {
    fetchOptions.headers = new window.Headers(fetchOptions.headers);
  }
  if (
    fetchOptions.headers.has('Content-Type') &&
    fetchOptions.headers.get('Content-Type') !== 'application/json'
  ) {
    throw new Error('fetchWithCache only supports JSON responses');
  }

  const currentTime = Date.now();
  const cacheKey = `cachedFetch:${url}`;
  const { cachedResponse, cachedTime } = (await getStorageItem(cacheKey)) || {};
  if (cachedResponse && currentTime - cachedTime < cacheRefreshTime) {
    return cachedResponse;
  }
  fetchOptions.headers.set('Content-Type', 'application/json');
  const fetchWithTimeout = getFetchWithTimeout(timeout);
  const response = await fetchWithTimeout(url, {
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
    ...fetchOptions,
  });
  if (!response.ok) {
    const message = `Fetch with cache failed within function ${functionName} with status'${response.status}': '${response.statusText}'`;
    if (allowStale) {
      console.debug(`${message}. Returning cached result`);
      return cachedResponse;
    }
    throw new Error(
      `Fetch with cache failed within function ${functionName} with status'${response.status}': '${response.statusText}'`,
    );
  }
  const responseJson =
    response.status === 204 ? undefined : await response.json();
  const cacheEntry = {
    cachedResponse: responseJson,
    cachedTime: currentTime,
  };

  await setStorageItem(cacheKey, cacheEntry);
  return responseJson;
};

export default fetchWithCache;
