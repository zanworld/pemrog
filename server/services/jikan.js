import axios from 'axios';

const BASE_URL = 'https://api.jikan.moe/v4';

const client = axios.create({
  baseURL: BASE_URL,
  // Kept short (not 15s) because this call sits inside a serverless function with a hard
  // execution ceiling (Vercel kills the whole function around ~10s on the default tier) —
  // a single hung attempt must not by itself burn the entire request budget.
  timeout: 5000,
});

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Short "circuit breaker": once a live attempt fails outright, skip trying Jikan again
// for a short cooldown window instead of repeating the same failed round-trip on every
// subsequent request during an outage. Lives for as long as this lambda instance is warm —
// it's a best-effort optimization, not a cross-instance guarantee.
let jikanDownUntil = 0;
const DOWN_COOLDOWN_MS = 30 * 1000;

async function fetchWithCacheAndRetry(url, config = {}, retries = 2, delayMs = 500) {
  const cacheKey = url + JSON.stringify(config.params || {});

  // Check cache
  if (cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
  }

  if (Date.now() < jikanDownUntil) {
    throw new Error(`Jikan marked down after a recent failure, skipping live attempt for ${Math.ceil((jikanDownUntil - Date.now()) / 1000)}s more`);
  }

  try {
    const response = await client.get(url, config);
    // Save to cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response.data,
    });
    jikanDownUntil = 0;

    // Slight delay after successful request to be nice to the API
    await sleep(350);

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    // Retry on rate limiting (429) and transient upstream/gateway errors (502/503/504 —
    // Jikan itself proxies MyAnimeList and returns 504 when MAL is briefly unreachable).
    // These are cheap to retry because a response came back promptly.
    // Deliberately do NOT retry when there's no response at all (timeout/DNS/connection
    // reset) — that means the request already spent up to the full client timeout hanging,
    // and retrying would risk exceeding the serverless function's own execution limit.
    // Let the caller's next fallback tier (MangaDex/mock) take over immediately instead.
    const isRetryable = status === 429 || status === 502 || status === 503 || status === 504;
    if (isRetryable && retries > 0) {
      console.warn(`Jikan API request failed (${status}) on ${url}, retrying in ${delayMs}ms... (${retries} retries left)`);
      await sleep(delayMs);
      return fetchWithCacheAndRetry(url, config, retries - 1, delayMs * 2);
    }
    jikanDownUntil = Date.now() + DOWN_COOLDOWN_MS;
    throw error;
  }
}

export async function searchManga(params) {
  return fetchWithCacheAndRetry('/manga', { params });
}

export async function getMangaById(id) {
  return fetchWithCacheAndRetry(`/manga/${id}`);
}

export async function getGenres() {
  return fetchWithCacheAndRetry('/genres/manga');
}
