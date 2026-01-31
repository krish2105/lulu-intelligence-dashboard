/**
 * Unified Data Sync Service
 * Provides real-time data synchronization across all dashboards
 */

declare const process: { env: { NEXT_PUBLIC_API_URL?: string } };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache: Map<string, CacheEntry> = new Map();

// Cache TTLs in milliseconds
const CACHE_TTL = {
  kpis: 15000,           // 15 seconds
  inventory: 30000,      // 30 seconds  
  promotions: 30000,     // 30 seconds
  alerts: 20000,         // 20 seconds
  analytics: 60000,      // 1 minute
  stores: 120000,        // 2 minutes
  items: 120000,         // 2 minutes
  admin: 60000,          // 1 minute
};

function getCache(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function fetchWithCache<T>(
  endpoint: string,
  cacheKey: string,
  ttl: number,
  options?: RequestInit
): Promise<T> {
  // Check cache first
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    setCache(cacheKey, data, ttl);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// KPIs Data
// ============================================================================
export interface KPIData {
  total_historical_records: number;
  total_streaming_records: number;
  total_sales_today: number;
  total_sales_week: number;
  total_sales_month: number;
  average_daily_sales: number;
  unique_stores: number;
  unique_items: number;
  data_range_start: string | null;
  data_range_end: string | null;
  last_stream_timestamp: string | null;
  sales_trend: 'up' | 'down' | 'stable';
}

export async function fetchKPIs(): Promise<KPIData> {
  return fetchWithCache<KPIData>('/api/kpis', 'kpis', CACHE_TTL.kpis);
}

// ============================================================================
// Inventory Data
// ============================================================================
export interface InventorySummary {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstocked_count: number;
  pending_transfers: number;
  currency: string;
}

export interface InventoryItem {
  id: number;
  item_id: number;
  item_name: string;
  category: string;
  store_id: number;
  store_name: string;
  quantity: number;
  reorder_level: number;
  max_stock_level: number;
  unit_cost: number;
  status: string;
}

export async function fetchInventorySummary(storeId?: number): Promise<InventorySummary> {
  const params = storeId ? `?store_id=${storeId}` : '';
  return fetchWithCache<InventorySummary>(
    `/api/inventory/summary${params}`,
    `inventory_summary_${storeId || 'all'}`,
    CACHE_TTL.inventory
  );
}

export async function fetchInventoryItems(params?: {
  store_id?: number;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: InventoryItem[]; total: number; pages: number }> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  const query = searchParams.toString() ? `?${searchParams}` : '';
  return fetchWithCache(
    `/api/inventory/items${query}`,
    `inventory_items_${query}`,
    CACHE_TTL.inventory
  );
}

// ============================================================================
// Promotions Data
// ============================================================================
export interface PromotionsSummary {
  active_promotions: number;
  scheduled_promotions: number;
  ended_promotions: number;
  draft_promotions: number;
  total_discounts_given: number;
  total_redemptions: number;
  currency: string;
}

export interface Promotion {
  id: number;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  status: string;
  redemptions: number;
  revenue_impact: number;
}

export async function fetchPromotionsSummary(): Promise<PromotionsSummary> {
  return fetchWithCache<PromotionsSummary>(
    '/api/promotions/summary',
    'promotions_summary',
    CACHE_TTL.promotions
  );
}

export async function fetchActivePromotions(storeId?: number): Promise<{ promotions: Promotion[] }> {
  const params = storeId ? `?store_id=${storeId}` : '';
  return fetchWithCache(
    `/api/promotions/active${params}`,
    `promotions_active_${storeId || 'all'}`,
    CACHE_TTL.promotions
  );
}

// ============================================================================
// Alerts Data
// ============================================================================
export interface AlertsSummary {
  critical_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  acknowledged: number;
  resolved_today: number;
  total_active: number;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  status: string;
  store_id?: number;
  store_name?: string;
  item_id?: number;
  item_name?: string;
  created_at: string;
}

export async function fetchAlertsSummary(): Promise<AlertsSummary> {
  return fetchWithCache<AlertsSummary>(
    '/api/alerts/summary',
    'alerts_summary',
    CACHE_TTL.alerts
  );
}

export async function fetchAlerts(params?: {
  status?: string;
  severity?: string;
  alert_type?: string;
  page?: number;
  limit?: number;
}): Promise<{ alerts: Alert[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  const query = searchParams.toString() ? `?${searchParams}` : '';
  return fetchWithCache(
    `/api/alerts/list${query}`,
    `alerts_list_${query}`,
    CACHE_TTL.alerts
  );
}

// ============================================================================
// Analytics Data
// ============================================================================
export async function fetchSalesTrend(days: number = 30): Promise<{ data: any[]; days: number }> {
  return fetchWithCache(
    `/api/analytics/trend?days=${days}`,
    `analytics_trend_${days}`,
    CACHE_TTL.analytics
  );
}

export async function fetchStoreDistribution(): Promise<{ data: any[]; total: number }> {
  return fetchWithCache(
    '/api/analytics/stores',
    'analytics_stores',
    CACHE_TTL.analytics
  );
}

export async function fetchTopItems(limit: number = 10): Promise<{ data: any[] }> {
  return fetchWithCache(
    `/api/analytics/top-items?limit=${limit}`,
    `analytics_top_items_${limit}`,
    CACHE_TTL.analytics
  );
}

export async function fetchCategoryBreakdown(): Promise<{ data: any[]; total: number }> {
  return fetchWithCache(
    '/api/analytics/categories',
    'analytics_categories',
    CACHE_TTL.analytics
  );
}

export async function fetchStreamingTrend(): Promise<{ data: any[] }> {
  // Streaming data should not be cached long
  return fetchWithCache(
    '/api/analytics/streaming-trend',
    'analytics_streaming',
    5000 // 5 seconds
  );
}

// ============================================================================
// Admin Data
// ============================================================================
export interface AdminDashboardData {
  total_users: number;
  total_stores: number;
  total_items: number;
  total_sales_records: number;
  system_health: string;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return fetchWithCache<AdminDashboardData>(
    '/api/admin/dashboard',
    'admin_dashboard',
    CACHE_TTL.admin
  );
}

export async function fetchAdminStores(): Promise<{ stores: any[] }> {
  return fetchWithCache(
    '/api/admin/stores',
    'admin_stores',
    CACHE_TTL.admin
  );
}

export async function fetchAdminUsers(): Promise<{ users: any[] }> {
  return fetchWithCache(
    '/api/admin/users',
    'admin_users',
    CACHE_TTL.admin
  );
}

// ============================================================================
// Reports Data
// ============================================================================
export async function fetchSalesReport(params?: {
  start_date?: string;
  end_date?: string;
  store_id?: number;
}): Promise<any> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  const query = searchParams.toString() ? `?${searchParams}` : '';
  return fetchWithCache(
    `/api/reports/sales${query}`,
    `reports_sales_${query}`,
    CACHE_TTL.analytics
  );
}

// ============================================================================
// Unified Dashboard Data Fetcher
// ============================================================================
export interface UnifiedDashboardData {
  kpis: KPIData;
  inventory: InventorySummary;
  promotions: PromotionsSummary;
  alerts: AlertsSummary;
}

export async function fetchAllDashboardData(): Promise<UnifiedDashboardData> {
  const [kpis, inventory, promotions, alerts] = await Promise.all([
    fetchKPIs(),
    fetchInventorySummary(),
    fetchPromotionsSummary(),
    fetchAlertsSummary(),
  ]);

  return { kpis, inventory, promotions, alerts };
}

// ============================================================================
// Cache Management
// ============================================================================
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

export function invalidateInventoryCache(): void {
  clearCache('inventory');
}

export function invalidatePromotionsCache(): void {
  clearCache('promotions');
}

export function invalidateAlertsCache(): void {
  clearCache('alerts');
}

// ============================================================================
// Real-time Data Subscription (SSE)
// ============================================================================
export function subscribeToSalesStream(
  onData: (data: any) => void,
  onError?: (error: any) => void
): () => void {
  const eventSource = new EventSource(`${API_URL}/api/streaming/sales`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onData(data);
      // Invalidate relevant caches when new data arrives
      clearCache('kpis');
      clearCache('analytics_streaming');
    } catch (e) {
      console.error('Failed to parse SSE data:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    onError?.(error);
  };

  return () => eventSource.close();
}
