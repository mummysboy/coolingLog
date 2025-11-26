// Service Worker for Food Chilling Log PWA
// Cache versioning and lifecycle management

const CACHE_VERSION = 'v1';
const CACHE_NAME = `food-chilling-log-${CACHE_VERSION}`;
const RUNTIME_CACHE = `food-chilling-log-runtime-${CACHE_VERSION}`;
const API_CACHE = `food-chilling-log-api-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/form',
  '/admin',
  '/globals.css',
  '/logo.avif',
];

// Paths that should always use network first
const NETWORK_FIRST_PATHS = [
  '/api/',
  '/_next/data/',
];

// Paths that should use cache first
const CACHE_FIRST_PATHS = [
  '/logo.avif',
  '/_next/static/',
  '/public/',
];

// API endpoints that should be cached (GraphQL mutations/queries)
const CACHEABLE_API_PATTERNS = [
  /\/graphql/,
  /\/api\/(queries|mutations)/,
];

/**
 * Install event: Precache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.warn('[Service Worker] Precache failed for some assets', error);
        // Don't fail the install if some assets fail
        return Promise.resolve();
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that don't match current version
          if (
            !cacheName.includes(CACHE_VERSION) &&
            cacheName.startsWith('food-chilling-log')
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

/**
 * Fetch event: Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle GraphQL API calls with network-first then cache strategy
  if (url.pathname.includes('/graphql') || url.pathname.includes('/api')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isCacheFirst(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle HTML pages with network-first strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: network first for everything else
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Cache-first strategy: Use cache if available, fallback to network
 */
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cached;
    }

    console.log('[Service Worker] Cache miss, fetching:', request.url);
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseToCache = response.clone();
      cache.add(request.clone());
      return response;
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache-first failed:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Network-first strategy: Try network, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    // Set a timeout for network requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(request, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Cache successful responses
    const responseToCache = response.clone();
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, responseToCache);

    console.log('[Service Worker] Network request successful:', request.url);
    return response;
  } catch (error) {
    console.warn('[Service Worker] Network request failed:', error);
    
    // Try to get from cache
    try {
      const cached = await caches.match(request);
      if (cached) {
        console.log('[Service Worker] Using cached response:', request.url);
        return cached;
      }
    } catch (cacheError) {
      console.error('[Service Worker] Cache lookup failed:', cacheError);
    }

    // Return offline fallback
    return getOfflineFallback(request);
  }
}

/**
 * Determine if a path should use cache-first strategy
 */
function isCacheFirst(pathname) {
  return CACHE_FIRST_PATHS.some((path) => pathname.includes(path));
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
  // For HTML requests, return offline page if available
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineCache = await caches.open(CACHE_NAME);
    const offlinePage = await offlineCache.match('/');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Return a basic offline response
  return new Response(
    JSON.stringify({
      offline: true,
      message: 'You are offline. This content is not available.',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skipping wait...');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache...');
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('[Service Worker] Runtime cache cleared');
    });
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-form-entries') {
    event.waitUntil(
      syncFormEntries()
    );
  }
});

/**
 * Sync form entries when connection restored
 */
async function syncFormEntries() {
  try {
    // This is a placeholder for actual sync logic
    // In a real implementation, you would:
    // 1. Get pending entries from IndexedDB
    // 2. Send them to the server
    // 3. Clear them from IndexedDB on success
    console.log('[Service Worker] Syncing form entries...');
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    return Promise.reject(error);
  }
}

console.log('[Service Worker] Loaded successfully');

