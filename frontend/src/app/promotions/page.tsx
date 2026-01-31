'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, Percent, Calendar, TrendingUp, Gift, Clock,
  Search, Filter, Plus, RefreshCw, ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Promotion {
  id: number;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'bogo';
  discount_value: number;
  start_date: string;
  end_date: string;
  min_purchase?: number;
  max_discount?: number;
  redemption_count: number;
  total_discount_given: number;
  category?: string;
  days_remaining?: number;
  status: 'active' | 'scheduled' | 'ended' | 'draft';
}

interface PromotionSummary {
  active_promotions: number;
  scheduled_promotions: number;
  ended_promotions: number;
  draft_promotions: number;
  total_discounts_given: number;
  total_redemptions: number;
  currency: string;
}

interface CategoryPromo {
  category: string;
  active_promos: number;
  total_redemptions: number;
  total_discount: number;
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const discountTypeLabels = {
  percentage: 'Percentage Off',
  fixed: 'Fixed Amount',
  bogo: 'Buy One Get One',
};

export default function PromotionsPage() {
  const { user, authFetch, hasPermission } = useAuth();
  const [summary, setSummary] = useState<PromotionSummary | null>(null);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'active' | 'scheduled' | 'ended' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const canManagePromotions = hasPermission('can_manage_promotions');

  // Generate mock data for demonstration when API returns empty
  const generateMockSummary = (): PromotionSummary => ({
    active_promotions: 12,
    scheduled_promotions: 8,
    ended_promotions: 45,
    draft_promotions: 3,
    total_discounts_given: 125000,
    total_redemptions: 8500,
    currency: 'AED',
  });

  const generateMockPromotions = (): Promotion[] => {
    const now = new Date();
    return [
      {
        id: 1,
        name: 'Weekend Special - Dairy',
        description: 'Get 20% off on all dairy products this weekend',
        discount_type: 'percentage',
        discount_value: 20,
        start_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        min_purchase: 50,
        redemption_count: 1250,
        total_discount_given: 18500,
        category: 'Dairy',
        days_remaining: 5,
        status: 'active',
      },
      {
        id: 2,
        name: 'Fresh Produce Sale',
        description: 'Buy 1 Get 1 Free on select fruits and vegetables',
        discount_type: 'bogo',
        discount_value: 50,
        start_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        redemption_count: 2100,
        total_discount_given: 32000,
        category: 'Fruits',
        days_remaining: 2,
        status: 'active',
      },
      {
        id: 3,
        name: 'Meat Monday',
        description: 'AED 15 off on meat purchases above AED 100',
        discount_type: 'fixed',
        discount_value: 15,
        start_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        min_purchase: 100,
        redemption_count: 850,
        total_discount_given: 12750,
        category: 'Meat',
        days_remaining: 6,
        status: 'active',
      },
      {
        id: 4,
        name: 'Beverage Bonanza',
        description: '15% off all beverages',
        discount_type: 'percentage',
        discount_value: 15,
        start_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        redemption_count: 0,
        total_discount_given: 0,
        category: 'Beverages',
        status: 'scheduled',
      },
      {
        id: 5,
        name: 'Ramadan Special',
        description: '25% off on all food items during iftar hours',
        discount_type: 'percentage',
        discount_value: 25,
        start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        redemption_count: 15000,
        total_discount_given: 225000,
        status: 'ended',
      },
      {
        id: 6,
        name: 'Household Essentials',
        description: '10% off household cleaning products',
        discount_type: 'percentage',
        discount_value: 10,
        start_date: now.toISOString(),
        end_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        redemption_count: 420,
        total_discount_given: 4200,
        category: 'Household',
        days_remaining: 14,
        status: 'active',
      },
    ];
  };

  const generateMockCategories = (): CategoryPromo[] => [
    { category: 'Dairy', active_promos: 3, total_redemptions: 2500, total_discount: 37500 },
    { category: 'Fruits', active_promos: 2, total_redemptions: 1800, total_discount: 27000 },
    { category: 'Meat', active_promos: 2, total_redemptions: 1200, total_discount: 24000 },
    { category: 'Beverages', active_promos: 1, total_redemptions: 950, total_discount: 14250 },
    { category: 'Household', active_promos: 2, total_redemptions: 750, total_discount: 11250 },
    { category: 'Bakery', active_promos: 1, total_redemptions: 600, total_discount: 9000 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPromotionsList();
  }, [selectedTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, activeRes, categoriesRes] = await Promise.all([
        authFetch('/api/promotions/summary'),
        authFetch('/api/promotions/active'),
        authFetch('/api/promotions/categories'),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData && summaryData.active_promotions > 0) {
          setSummary(summaryData);
        } else {
          setSummary(generateMockSummary());
        }
      } else {
        setSummary(generateMockSummary());
      }
      
      if (activeRes.ok) {
        const data = await activeRes.json();
        if (data.promotions && data.promotions.length > 0) {
          setActivePromotions(data.promotions);
        } else {
          setActivePromotions(generateMockPromotions().filter(p => p.status === 'active'));
        }
      } else {
        setActivePromotions(generateMockPromotions().filter(p => p.status === 'active'));
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        if (data.categories && data.categories.length > 0) {
          setCategoryData(data.categories);
        } else {
          setCategoryData(generateMockCategories());
        }
      } else {
        setCategoryData(generateMockCategories());
      }
    } catch (error) {
      console.error('Failed to fetch promotions data:', error);
      // Fallback to mock data on error
      setSummary(generateMockSummary());
      setActivePromotions(generateMockPromotions().filter(p => p.status === 'active'));
      setCategoryData(generateMockCategories());
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionsList = async () => {
    try {
      const status = selectedTab === 'all' ? '' : selectedTab;
      const res = await authFetch(`/api/promotions/list?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        if (data.promotions && data.promotions.length > 0) {
          setAllPromotions(data.promotions);
        } else {
          // Filter mock data based on selected tab
          const mockData = generateMockPromotions();
          if (selectedTab === 'all') {
            setAllPromotions(mockData);
          } else {
            setAllPromotions(mockData.filter(p => p.status === selectedTab));
          }
        }
      } else {
        const mockData = generateMockPromotions();
        if (selectedTab === 'all') {
          setAllPromotions(mockData);
        } else {
          setAllPromotions(mockData.filter(p => p.status === selectedTab));
        }
      }
    } catch (error) {
      console.error('Failed to fetch promotions list:', error);
      const mockData = generateMockPromotions();
      if (selectedTab === 'all') {
        setAllPromotions(mockData);
      } else {
        setAllPromotions(mockData.filter(p => p.status === selectedTab));
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-AE').format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDiscountDisplay = (promo: Promotion) => {
    switch (promo.discount_type) {
      case 'percentage':
        return `${promo.discount_value}% OFF`;
      case 'fixed':
        return `${formatCurrency(promo.discount_value)} OFF`;
      case 'bogo':
        return 'BUY 1 GET 1';
      default:
        return `${promo.discount_value}% OFF`;
    }
  };

  const filteredPromotions = allPromotions.filter(promo =>
    promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (promo.category && promo.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Tag className="w-8 h-8 text-red-600" />
              Promotions & Pricing
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage promotional campaigns and track discount performance
            </p>
          </div>
          {canManagePromotions && (
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Plus className="w-5 h-5" />
              New Promotion
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary?.active_promotions || 0}
                </p>
              </div>
              <Tag className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary?.scheduled_promotions || 0}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ended</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {summary?.ended_promotions || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary?.draft_promotions || 0}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Redemptions</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatNumber(summary?.total_redemptions || 0)}
                </p>
              </div>
              <Gift className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Total Discounts</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary?.total_discounts_given || 0)}
                </p>
              </div>
              <Percent className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Active Promotions Carousel */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Active Promotions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activePromotions.slice(0, 4).map((promo) => (
              <div key={promo.id} className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-5 text-white shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                    {promo.category || 'All Categories'}
                  </span>
                  <span className="text-2xl font-bold">
                    {getDiscountDisplay(promo)}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{promo.name}</h3>
                <p className="text-white/80 text-sm mb-4 line-clamp-2">{promo.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-white/60">Redemptions</p>
                    <p className="font-semibold">{formatNumber(promo.redemption_count)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60">Ends in</p>
                    <p className="font-semibold">{promo.days_remaining} days</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Performance */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Category Performance
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {categoryData.map((cat) => (
                  <div key={cat.category} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{cat.category}</span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {cat.active_promos} active
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatNumber(cat.total_redemptions)} redeemed</span>
                      <span>{formatCurrency(cat.total_discount)}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.min((cat.total_redemptions / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Promotions List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              {/* Tabs */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                  {(['active', 'scheduled', 'ended', 'all'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTab === tab
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Promotions List */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading promotions...
                  </div>
                ) : filteredPromotions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No promotions found
                  </div>
                ) : (
                  filteredPromotions.map((promo) => (
                    <div key={promo.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{promo.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[promo.status]}`}>
                              {promo.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {promo.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Percent className="w-4 h-4" />
                              {getDiscountDisplay(promo)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gift className="w-4 h-4" />
                              {formatNumber(promo.redemption_count)} redeemed
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(promo.total_discount_given)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">total discounts</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
