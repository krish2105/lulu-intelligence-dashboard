'use client';

import { useSalesData } from '@/hooks/useSalesData';
import { useSSE } from '@/hooks/useSSE';
import MetricsCard from './MetricsCard';
import SalesChart from './SalesChart';
import SalesTable from './SalesTable';
import PredictionCard from './PredictionCard';
import LiveIndicator from './LiveIndicator';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Store, Item } from '@/types';

export default function Dashboard() {
  const { sales, aggregatedSales, metrics, predictions, stores, items, loading, error, refresh } = useSalesData();
  const { streamingSales, isConnected, error: streamError } = useSSE();
  
  // Create lookup maps for store and item names
  const storeMap = stores.reduce((acc: Record<number, string>, store: Store) => {
    acc[store.id] = store.name;
    return acc;
  }, {} as Record<number, string>);
  
  const itemMap = items.reduce((acc: Record<number, string>, item: Item) => {
    acc[item.id] = item.name;
    return acc;
  }, {} as Record<number, string>);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lulu Hypermarket UAE</h1>
          <p className="text-gray-600 mt-1">Real-time sales monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator isConnected={isConnected} />
          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Today's Sales"
            value={metrics.total_sales_today}
            icon={getTrendIcon(metrics.sales_trend)}
          />
          <MetricsCard
            title="Weekly Sales"
            value={metrics.total_sales_week}
            subtitle="Last 7 days"
          />
          <MetricsCard
            title="Monthly Sales"
            value={metrics.total_sales_month}
            subtitle="Last 30 days"
          />
          <MetricsCard
            title="Streaming Records"
            value={metrics.streaming_records_count}
            subtitle="Live data points"
            highlight
          />
        </div>
      )}
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Historical Sales Trend</h2>
          <SalesChart data={aggregatedSales} />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sales Predictions</h2>
          <PredictionCard predictions={predictions} />
        </div>
      </div>
      
      {/* Live Streaming Data */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Live Streaming Sales</h2>
          {streamError && (
            <span className="text-sm text-yellow-600">{streamError}</span>
          )}
        </div>
        <SalesTable 
          sales={streamingSales.length > 0 ? streamingSales : sales.filter(s => s.is_streaming)} 
          storeMap={storeMap}
          itemMap={itemMap}
        />
      </div>
      
      {/* Recent Sales History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Sales History</h2>
        <SalesTable 
          sales={sales.filter(s => !s.is_streaming).slice(0, 20)} 
          storeMap={storeMap}
          itemMap={itemMap}
        />
      </div>
    </div>
  );
}
