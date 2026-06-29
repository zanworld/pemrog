import axios from 'axios';

const BASE_URL = 'https://api.jikan.moe/v4';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithCacheAndRetry(url, config = {}, retries = 3, delayMs = 1000) {
  const cacheKey = url + JSON.stringify(config.params || {});

  // Check cache
  if (cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
  }

  try {
    const response = await client.get(url, config);
    // Save to cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response.data,
    });
    
    // Slight delay after successful request to be nice to the API
    await sleep(350); 
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.warn(`Jikan API rate limited on ${url}, retrying in ${delayMs}ms...`);
      await sleep(delayMs);
      return fetchWithCacheAndRetry(url, config, retries - 1, delayMs * 2);
    }
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
