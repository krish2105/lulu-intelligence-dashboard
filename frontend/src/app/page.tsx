import KPICards from '@/components/KPICards';
import LiveTable from '@/components/LiveTable';
import {
  SalesTrendChart,
  StoreDistributionChart,
  TopItemsChart,
  CategoryBreakdownChart,
  LiveStreamChart
} from '@/components/charts';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Lulu Hypermarket UAE</h1>
            <p className="text-slate-400 mt-2">Real-time sales monitoring and analytics dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="relative">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 animate-pulse-glow"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="text-sm font-medium text-white">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* KPI Cards - Auto-refresh every 30 seconds */}
        <section>
          <KPICards refreshInterval={30000} />
        </section>

        {/* Executive Charts Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full"></span>
            Executive Insights
          </h2>
          
          {/* Sales Trend with Forecast - Full Width */}
          <div className="mb-6">
            <SalesTrendChart days={30} />
          </div>

          {/* Live Stream Chart - Full Width */}
          <div className="mb-6">
            <LiveStreamChart />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Distribution Pie Chart */}
            <StoreDistributionChart />
            
            {/* Category Breakdown Donut Chart */}
            <CategoryBreakdownChart />
          </div>

          {/* Top Items Bar Chart - Full Width */}
          <div className="mt-6">
            <TopItemsChart />
          </div>
        </section>
        
        {/* Live Table - SSE Real-time updates */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full"></span>
            Real-Time Stream
          </h2>
          <LiveTable />
        </section>
      </div>
    </main>
  );
}
