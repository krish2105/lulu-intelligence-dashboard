'use client';

import { useEffect, useState, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Activity, Zap, Clock } from 'lucide-react';

interface StreamingDataPoint {
  timestamp: string;
  store_name: string;
  item_name: string;
  sales: number;
  cumulative: number;
}

export default function LiveStreamChart() {
  const [data, setData] = useState<StreamingDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [totalStreaming, setTotalStreaming] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics/streaming-trend');
        if (!response.ok) throw new Error('Failed to fetch streaming data');
        const result = await response.json();
        setData(result.data);
        setTotalStreaming(result.total_streaming);
      } catch (error) {
        console.error('Error fetching streaming data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    if (!mounted) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: StreamingDataPoint }> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="glass rounded-lg p-3 border border-slate-600">
          <p className="text-white font-semibold text-sm">{mounted ? formatTime(point.timestamp) : '--'}</p>
          <p className="text-slate-400 text-xs">{point.store_name}</p>
          <p className="text-slate-400 text-xs mb-1">{point.item_name}</p>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-xs text-slate-500">Sale</p>
              <p className="text-cyan-400 font-bold">{point.sales}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cumulative</p>
              <p className="text-emerald-400 font-bold">{point.cumulative}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 h-[300px] flex items-center justify-center">
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
            <p className="text-xs text-slate-400">Cumulative sales in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{formatNumber(totalStreaming)}</div>
            <div className="text-xs text-slate-400">Total Today</div>
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

      {/* Chart */}
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
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
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
                type="stepAfter"
                dataKey="cumulative"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#cumulativeGradient)"
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent transactions */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">Recent Transactions</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.slice(-5).reverse().map((point, index) => (
              <div 
                key={index}
                className="flex-shrink-0 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="text-xs text-slate-400">{mounted ? formatTime(point.timestamp) : '--'}</div>
                <div className="text-sm text-white font-semibold">{point.sales} units</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
