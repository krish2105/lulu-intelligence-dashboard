'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Activity, Zap, Clock, ShoppingBag, Store, TrendingUp, Package } from 'lucide-react';

interface StreamingDataPoint {
  timestamp: string;
  store_name: string;
  item_name: string;
  sales: number;
  cumulative: number;
}

interface StoreItemMap {
  stores: Record<number, string>;
  items: Record<number, { name: string; category: string }>;
}

interface LiveSaleEvent {
  id: number;
  date: string;
  store_id: number;
  item_id: number;
  sales: number;
  is_streaming: boolean;
  created_at: string;
  store_name?: string;
  item_name?: string;
  category?: string;
}

// Color palette for different categories/stores
const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#3b82f6', '#84cc16'];

export default function LiveStreamChart() {
  const [data, setData] = useState<StreamingDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [totalStreaming, setTotalStreaming] = useState(0);
  const [recentSales, setRecentSales] = useState<LiveSaleEvent[]>([]);
  const [storeItemMap, setStoreItemMap] = useState<StoreItemMap>({ stores: {}, items: {} });
  const [salesByStore, setSalesByStore] = useState<Record<string, number>>({});
  const [salesByCategory, setSalesByCategory] = useState<Record<string, number>>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch store and item mappings for enriching live data
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const [storesRes, itemsRes] = await Promise.all([
          fetch('http://localhost:8000/api/analytics/stores'),
          fetch('http://localhost:8000/api/analytics/top-items?limit=50')
        ]);
        
        if (storesRes.ok) {
          const storesData = await storesRes.json();
          const storesMap: Record<number, string> = {};
          storesData.data?.forEach((s: { store_id: number; store_name: string }) => {
            storesMap[s.store_id] = s.store_name;
          });
          setStoreItemMap(prev => ({ ...prev, stores: storesMap }));
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          const itemsMap: Record<number, { name: string; category: string }> = {};
          itemsData.data?.forEach((i: { item_id: number; item_name: string; category: string }) => {
            itemsMap[i.item_id] = { name: i.item_name, category: i.category };
          });
          setStoreItemMap(prev => ({ ...prev, items: itemsMap }));
        }
      } catch (error) {
        console.error('Error fetching mappings:', error);
      }
    };
    fetchMappings();
  }, []);

  // Fetch initial streaming data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics/streaming-trend');
        if (!response.ok) throw new Error('Failed to fetch streaming data');
        const result = await response.json();
        setData(result.data || []);
        setTotalStreaming(result.total_streaming || 0);
        
        // Calculate sales by store and category from historical data
        const byStore: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        result.data?.forEach((point: StreamingDataPoint) => {
          byStore[point.store_name] = (byStore[point.store_name] || 0) + point.sales;
        });
        setSalesByStore(byStore);
      } catch (error) {
        console.error('Error fetching streaming data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // SSE Connection for real-time updates
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('http://localhost:8000/api/stream/sales');
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('sales', (event) => {
      try {
        const saleData: LiveSaleEvent = JSON.parse(event.data);
        
        // Enrich with store/item names
        const storeName = storeItemMap.stores[saleData.store_id] || `Store ${saleData.store_id}`;
        const itemInfo = storeItemMap.items[saleData.item_id] || { name: `Item ${saleData.item_id}`, category: 'General' };
        
        const enrichedSale: LiveSaleEvent = {
          ...saleData,
          store_name: storeName,
          item_name: itemInfo.name,
          category: itemInfo.category
        };

        // Add to recent sales (keep last 10)
        setRecentSales(prev => [enrichedSale, ...prev.slice(0, 9)]);
        
        // Update totals
        setTotalStreaming(prev => prev + saleData.sales);
        
        // Update sales by store
        setSalesByStore(prev => ({
          ...prev,
          [storeName]: (prev[storeName] || 0) + saleData.sales
        }));
        
        // Update chart data
        setData(prev => {
          const lastCumulative = prev.length > 0 ? prev[prev.length - 1].cumulative : 0;
          const newPoint: StreamingDataPoint = {
            timestamp: saleData.created_at,
            store_name: storeName,
            item_name: itemInfo.name,
            sales: saleData.sales,
            cumulative: lastCumulative + saleData.sales
          };
          return [...prev.slice(-49), newPoint]; // Keep last 50 points
        });
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
    };
  }, [storeItemMap]);

  useEffect(() => {
    if (Object.keys(storeItemMap.stores).length > 0) {
      connectSSE();
    }
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectSSE, storeItemMap.stores]);

  const formatTime = (timestamp: string) => {
    if (!mounted || !timestamp) return '--:--';
    try {
      // Handle various timestamp formats
      let dateStr = timestamp;
      // If it doesn't have timezone info, assume UTC
      if (!dateStr.includes('Z') && !dateStr.includes('+')) {
        dateStr = dateStr + 'Z';
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getTimeSince = (timestamp: string) => {
    if (!mounted || !timestamp) return 'just now';
    try {
      let dateStr = timestamp;
      if (!dateStr.includes('Z') && !dateStr.includes('+')) {
        dateStr = dateStr + 'Z';
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'just now';
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      return `${Math.floor(seconds / 3600)}h ago`;
    } catch {
      return 'just now';
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: StreamingDataPoint }> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="glass rounded-lg p-4 border border-slate-600 shadow-xl min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 text-cyan-400" />
            <p className="text-white font-semibold text-sm">{mounted ? formatTime(point.timestamp) : '--'}</p>
          </div>
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2">
              <Store className="w-3 h-3 text-violet-400" />
              <p className="text-slate-300 text-xs">{point.store_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-3 h-3 text-amber-400" />
              <p className="text-slate-300 text-xs">{point.item_name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div>
              <p className="text-xs text-slate-500">Sale</p>
              <p className="text-cyan-400 font-bold text-lg">{point.sales}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Cumulative</p>
              <p className="text-emerald-400 font-bold text-lg">{formatNumber(point.cumulative)}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Prepare store distribution data for mini bar chart
  const storeChartData = Object.entries(salesByStore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sales], index) => ({ name: name.replace('Store ', 'S'), fullName: name, sales, color: COLORS[index % COLORS.length] }));

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 h-[500px] flex items-center justify-center">
        <div className="shimmer w-full h-full rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 relative">
            <Activity className="w-5 h-5 text-rose-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Live Streaming Sales</h3>
            <p className="text-xs text-slate-400">Real-time sales with item details</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{formatNumber(totalStreaming)}</div>
            <div className="text-xs text-slate-400">Total Streaming</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-sm font-bold text-rose-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[200px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>Waiting for streaming data...</p>
              <p className="text-xs text-slate-600 mt-1">Data will appear as sales stream in</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatNumber}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#cumulativeGradient)"
                dot={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/50">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{data.length}</div>
          <div className="text-xs text-slate-500">Transactions</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <Store className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{Object.keys(salesByStore).length}</div>
          <div className="text-xs text-slate-500">Active Stores</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <ShoppingBag className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-white">{data.length > 0 ? Math.round(totalStreaming / data.length) : 0}</div>
          <div className="text-xs text-slate-500">Avg per Sale</div>
        </div>
      </div>

      {/* Live Feed - Recent Sales with Details */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium text-white">Live Sales Feed</span>
          </div>
          <span className="text-xs text-slate-500">{recentSales.length > 0 || data.length > 0 ? 'Updating in real-time' : 'Waiting...'}</span>
        </div>
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {(recentSales.length > 0 ? recentSales : data.slice(-5).reverse()).map((sale, index) => {
            const isRecentSale = 'category' in sale;
            const saleItem = isRecentSale ? sale as LiveSaleEvent : null;
            const dataPoint = !isRecentSale ? sale as StreamingDataPoint : null;
            
            return (
              <div 
                key={saleItem?.id || index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                  index === 0 && recentSales.length > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 animate-pulse'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    index === 0 && recentSales.length > 0 ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                  }`}>
                    <ShoppingBag className={`w-5 h-5 ${index === 0 && recentSales.length > 0 ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {saleItem?.item_name || dataPoint?.item_name || 'Unknown Item'}
                      </span>
                      {saleItem?.category && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-400">
                          {saleItem.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Store className="w-3 h-3" />
                      <span>{saleItem?.store_name || dataPoint?.store_name || 'Unknown Store'}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{getTimeSince(saleItem?.created_at || dataPoint?.timestamp || '')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-400">
                    {saleItem?.sales || dataPoint?.sales || 0}
                  </div>
                  <div className="text-xs text-slate-500">units</div>
                </div>
              </div>
            );
          })}
          
          {recentSales.length === 0 && data.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Zap className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No sales yet today</p>
              <p className="text-xs mt-1">Sales will appear here as they stream in</p>
            </div>
          )}
        </div>
      </div>

      {/* Store Distribution Mini Chart */}
      {storeChartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-white">Sales by Store (Today)</span>
          </div>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  stroke="#94a3b8"
                  width={30}
                />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Sales']}
                  labelFormatter={(label: string) => storeChartData.find(s => s.name === label)?.fullName || label}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                  {storeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
