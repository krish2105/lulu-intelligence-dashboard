const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// SIMPLE IN-MEMORY CACHE FOR API RESPONSES
// ============================================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Cache TTLs in milliseconds
const CACHE_TTL: Record<string, number> = {
  'kpis': 15000,              // 15 seconds
  'sales': 10000,             // 10 seconds
  'stores': 300000,           // 5 minutes (rarely changes)
  'items': 300000,            // 5 minutes
  'metrics': 30000,           // 30 seconds
  'predictions': 60000,       // 1 minute
  'aggregated': 30000,        // 30 seconds
  'inventory': 30000,         // 30 seconds
  'promotions': 60000,        // 1 minute
  'alerts': 30000,            // 30 seconds
  'default': 20000            // 20 seconds default
};

function getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramsStr}`;
}

function getCachedData<T>(key: string, ttlKey: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  const ttl = CACHE_TTL[ttlKey] || CACHE_TTL.default;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Clear old cache entries periodically (keep cache under 100 entries)
  if (cache.size > 100) {
    const keysToDelete: string[] = [];
    cache.forEach((entry, k) => {
      if (Date.now() - entry.timestamp > 300000) {
        keysToDelete.push(k);
      }
    });
    keysToDelete.forEach(k => cache.delete(k));
  }
}

// Helper to get auth header
function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Fast fetch with timeout and caching
async function cachedFetch<T>(
  endpoint: string, 
  ttlKey: string,
  params?: Record<string, unknown>,
  options: RequestInit = {}
): Promise<T> {
  const cacheKey = getCacheKey(endpoint, params);
  const cached = getCachedData<T>(cacheKey, ttlKey);
  if (cached) return cached;
  
  // Build URL with params
  let url = `${API_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams}`;
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Clear specific cache entries
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  cache.forEach((_, key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

// ============================================================================
// API FUNCTIONS WITH CACHING
// ============================================================================

export async function fetchSales(params?: {
  start_date?: string;
  end_date?: string;
  store_id?: number;
  item_id?: number;
  streaming_only?: boolean;
  limit?: number;
}) {
  return cachedFetch('/api/sales/', 'sales', params as Record<string, unknown>);
}

export async function fetchAggregatedSales(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return cachedFetch('/api/sales/aggregated', 'aggregated', params as Record<string, unknown>);
}

export async function fetchMetrics() {
  return cachedFetch('/api/sales/metrics', 'metrics');
}

export async function fetchPredictions(days: number = 30) {
  return cachedFetch('/api/sales/predictions', 'predictions', { days });
}

export async function fetchStores() {
  return cachedFetch('/api/sales/stores', 'stores');
}

export async function fetchItems() {
  return cachedFetch('/api/sales/items', 'items');
}

export async function fetchKPIs() {
  return cachedFetch('/api/kpis', 'kpis');
}
