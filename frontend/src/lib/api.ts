const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchSales(params?: {
  start_date?: string;
  end_date?: string;
  store_id?: number;
  item_id?: number;
  streaming_only?: boolean;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(`${API_URL}/api/sales/?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch sales');
  return response.json();
}

export async function fetchAggregatedSales(params?: {
  start_date?: string;
  end_date?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(`${API_URL}/api/sales/aggregated?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch aggregated sales');
  return response.json();
}

export async function fetchMetrics() {
  const response = await fetch(`${API_URL}/api/sales/metrics`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

export async function fetchPredictions(days: number = 30) {
  const response = await fetch(`${API_URL}/api/sales/predictions?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch predictions');
  return response.json();
}

export async function fetchStores() {
  const response = await fetch(`${API_URL}/api/sales/stores`);
  if (!response.ok) throw new Error('Failed to fetch stores');
  return response.json();
}

export async function fetchItems() {
  const response = await fetch(`${API_URL}/api/sales/items`);
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}
