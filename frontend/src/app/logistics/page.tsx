'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Package, ShoppingCart, Check, X, Clock,
  AlertTriangle, CheckCircle, ChevronRight, RefreshCw,
  Bell, Eye, Filter, Search, FileText, Users,
  ArrowRight, Shield, ChevronDown, ChevronUp, Send, XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProcurementOrder {
  id: number;
  item_id: number;
  item_name: string;
  category: string;
  store_id: number;
  store_name: string;
  quantity: number;
  unit_cost: number;
  estimated_cost: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  notes: string;
  status: string;
  created_by: string;
  created_by_email: string;
  created_by_role: string;
  created_at: string;
  updated_at: string;
  approval_chain: ApprovalStep[];
  history: HistoryEntry[];
}

interface ApprovalStep {
  step: number;
  role: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string | null;
  comments: string;
}

interface HistoryEntry {
  action: string;
  by: string;
  role: string;
  timestamp: string;
  details: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  severity: string;
  order_id: number | null;
  created_by: string;
  created_at: string;
  read_by: string[];
}

interface DashboardSummary {
  pending_logistics_review: number;
  pending_vp_approval: number;
  approved: number;
  rejected: number;
  in_transit: number;
  delivered: number;
  total_orders: number;
  total_cost_pending: number;
  total_cost_approved: number;
  currency: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_logistics: { label: 'Pending Logistics', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  pending_vp_approval: { label: 'Pending VP Approval', color: 'bg-purple-500/20 text-purple-400', icon: Shield },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  in_transit: { label: 'In Transit', color: 'bg-blue-500/20 text-blue-400', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-500/20 text-emerald-400', icon: Package },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400', icon: X },
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white',
};

export default function LogisticsPage() {
  const { user, authFetch, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'notifications' | 'changes' | 'team'>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    item_name: '', category: 'General', store_id: 1, store_name: 'Al Barsha',
    quantity: 100, unit_cost: 25, priority: 'medium', reason: '', notes: '', item_id: 1,
  });

  const isSuperAdmin = hasRole('super_admin');
  const isManager = hasRole('regional_manager') || hasRole('store_manager');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await authFetch('/api/logistics/dashboard');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        if (data.recent_orders) setOrders(data.recent_orders);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
    }
  }, [authFetch]);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      const res = await authFetch(`/api/logistics/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  }, [authFetch, filterStatus, filterPriority]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/logistics/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, [authFetch]);

  const fetchChanges = useCallback(async () => {
    try {
      const res = await authFetch('/api/logistics/changes');
      if (res.ok) {
        const data = await res.json();
        setChanges(data.changes || []);
      }
    } catch (e) {
      console.error('Error:', e);
    }
  }, [authFetch]);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await authFetch('/api/logistics/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
      }
    } catch (e) {
      console.error('Error:', e);
    }
  }, [authFetch]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDashboard(), fetchNotifications()]).finally(() => setLoading(false));
  }, [fetchDashboard, fetchNotifications]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'changes') fetchChanges();
    if (activeTab === 'team') fetchTeam();
  }, [activeTab, fetchOrders, fetchNotifications, fetchChanges, fetchTeam]);

  const handleCreateOrder = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      if (res.ok) {
        setShowCreateOrder(false);
        setNewOrder({ item_name: '', category: 'General', store_id: 1, store_name: 'Al Barsha', quantity: 100, unit_cost: 25, priority: 'medium', reason: '', notes: '', item_id: 1 });
        await fetchDashboard();
        await fetchOrders();
        await fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to create order:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogisticsReview = async (orderId: number, decision: string) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/logistics/orders/${orderId}/logistics-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments: approvalComments }),
      });
      if (res.ok) {
        setSelectedOrder(null);
        setApprovalComments('');
        await fetchDashboard();
        await fetchOrders();
        await fetchNotifications();
      }
    } catch (e) {
      console.error('Logistics review failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVPApproval = async (orderId: number, decision: string) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/logistics/orders/${orderId}/vp-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments: approvalComments }),
      });
      if (res.ok) {
        setSelectedOrder(null);
        setApprovalComments('');
        await fetchDashboard();
        await fetchOrders();
        await fetchNotifications();
      }
    } catch (e) {
      console.error('VP approval failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async (orderId: number) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/logistics/orders/${orderId}/ship`, { method: 'POST' });
      if (res.ok) { setSelectedOrder(null); await fetchDashboard(); await fetchOrders(); await fetchNotifications(); }
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleDeliver = async (orderId: number) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/logistics/orders/${orderId}/deliver`, { method: 'POST' });
      if (res.ok) { setSelectedOrder(null); await fetchDashboard(); await fetchOrders(); await fetchNotifications(); }
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleCancel = async (orderId: number) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/logistics/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'cancelled', comments: approvalComments }),
      });
      if (res.ok) { setSelectedOrder(null); setApprovalComments(''); await fetchDashboard(); await fetchOrders(); await fetchNotifications(); }
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleMarkNotificationRead = async (notifId: number) => {
    try {
      await authFetch(`/api/logistics/notifications/${notifId}/read`, { method: 'POST' });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await authFetch('/api/logistics/notifications/read-all', { method: 'POST' });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(v);
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-AE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = orders.filter(o =>
    o.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stores = [
    { id: 1, name: 'Al Barsha' },
    { id: 2, name: 'Deira City Centre' },
    { id: 3, name: 'Karama' },
    { id: 4, name: 'Mushrif Mall' },
    { id: 5, name: 'Al Wahda' },
  ];

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Truck className="w-8 h-8 text-cyan-500" />
              Logistics & Procurement
            </h1>
            <p className="mt-2 text-slate-400">
              Manage procurement orders, approvals, and logistics operations
            </p>
          </div>
          <button
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            <ShoppingCart className="w-5 h-5" />
            New Order
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: <Package className="w-5 h-5" /> },
            { key: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
            { key: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
            { key: 'changes', label: 'Audit Log', icon: <FileText className="w-5 h-5" /> },
            { key: 'team', label: 'Team', icon: <Users className="w-5 h-5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass rounded-xl p-4 border-l-4 border-amber-500">
                <p className="text-sm text-slate-400">Pending Review</p>
                <p className="text-2xl font-bold text-amber-400">{summary?.pending_logistics_review || 0}</p>
              </div>
              <div className="glass rounded-xl p-4 border-l-4 border-purple-500">
                <p className="text-sm text-slate-400">Pending VP</p>
                <p className="text-2xl font-bold text-purple-400">{summary?.pending_vp_approval || 0}</p>
              </div>
              <div className="glass rounded-xl p-4 border-l-4 border-green-500">
                <p className="text-sm text-slate-400">Approved</p>
                <p className="text-2xl font-bold text-green-400">{summary?.approved || 0}</p>
              </div>
              <div className="glass rounded-xl p-4 border-l-4 border-blue-500">
                <p className="text-sm text-slate-400">In Transit</p>
                <p className="text-2xl font-bold text-blue-400">{summary?.in_transit || 0}</p>
              </div>
              <div className="glass rounded-xl p-4 border-l-4 border-emerald-500">
                <p className="text-sm text-slate-400">Delivered</p>
                <p className="text-2xl font-bold text-emerald-400">{summary?.delivered || 0}</p>
              </div>
              <div className="glass rounded-xl p-4 border-l-4 border-red-500">
                <p className="text-sm text-slate-400">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-6">
                <h3 className="text-sm text-slate-400 mb-2">Pending Cost</h3>
                <p className="text-3xl font-bold text-amber-400">{formatCurrency(summary?.total_cost_pending || 0)}</p>
                <p className="text-sm text-slate-500 mt-1">Awaiting approval</p>
              </div>
              <div className="glass rounded-xl p-6">
                <h3 className="text-sm text-slate-400 mb-2">Approved Cost</h3>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(summary?.total_cost_approved || 0)}</p>
                <p className="text-sm text-slate-500 mt-1">Being processed / in transit</p>
              </div>
            </div>

            {/* Approval Chain Visual */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Approval Workflow
              </h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Step 1: Request</p>
                    <p className="text-xs text-slate-400">Any user creates order</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 hidden md:block" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Step 2: Logistics Review</p>
                    <p className="text-xs text-slate-400">Logistics head reviews</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 hidden md:block" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Step 3: VP Approval</p>
                    <p className="text-xs text-slate-400">Yash Patel (Senior VP) finalizes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 hidden md:block" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 border border-green-500/30">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Complete</p>
                    <p className="text-xs text-slate-400">Ship & Deliver</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No procurement orders yet.</p>
                  <button onClick={() => setShowCreateOrder(true)} className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-lg">
                    Create First Order
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => {
                    const cfg = statusConfig[order.status] || statusConfig.pending_logistics;
                    const StatusIcon = cfg.icon;
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => { setSelectedOrder(order); setActiveTab('orders'); }}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[order.priority]}`}>
                            {order.priority.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-white font-medium">{order.item_name}</p>
                            <p className="text-xs text-slate-400">{order.store_name} &bull; {order.quantity} units &bull; by {order.created_by}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-500">{formatTime(order.created_at)}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="glass rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Search orders..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white">
                  <option value="">All Status</option>
                  <option value="pending_logistics">Pending Logistics</option>
                  <option value="pending_vp_approval">Pending VP</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white">
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={() => fetchOrders()} className="p-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Store</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Requested By</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                          No orders found. Create your first procurement order.
                        </td>
                      </tr>
                    ) : filteredOrders.map(order => {
                      const cfg = statusConfig[order.status] || statusConfig.pending_logistics;
                      const StatusIcon = cfg.icon;
                      return (
                        <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 text-slate-300">#{order.id}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[order.priority]}`}>
                              {order.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{order.item_name}</p>
                            <p className="text-xs text-slate-400">{order.category}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{order.store_name}</td>
                          <td className="px-4 py-3 text-right text-white">{order.quantity}</td>
                          <td className="px-4 py-3 text-right text-white">{formatCurrency(order.estimated_cost)}</td>
                          <td className="px-4 py-3">
                            <p className="text-slate-300 text-sm">{order.created_by}</p>
                            <p className="text-xs text-slate-500">{order.created_by_role}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 justify-center ${cfg.color}`}>
                              <StatusIcon className="w-3 h-3" />{cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-400" />
                Notifications
                {unreadCount > 0 && <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">{unreadCount} unread</span>}
              </h2>
              <button onClick={handleMarkAllRead} className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-600">
                Mark All Read
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Bell className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-xl text-white mb-2">No Notifications</p>
                <p className="text-slate-400">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div key={notif.id} className={`glass rounded-xl p-4 border-l-4 cursor-pointer ${
                    notif.severity === 'critical' ? 'border-red-500' :
                    notif.severity === 'warning' ? 'border-amber-500' :
                    notif.severity === 'success' ? 'border-green-500' : 'border-blue-500'
                  } ${notif.read_by?.includes(user?.email || '') ? 'opacity-60' : ''}`}
                    onClick={() => handleMarkNotificationRead(notif.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{notif.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{notif.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500">{formatTime(notif.created_at)}</span>
                          {notif.created_by && <span className="text-xs text-slate-500">by {notif.created_by}</span>}
                        </div>
                      </div>
                      {!notif.read_by?.includes(user?.email || '') && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'changes' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-cyan-400" />
              Changes & Audit Log
            </h2>
            {changes.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-xl text-white mb-2">No Changes Yet</p>
                <p className="text-slate-400">Actions on procurement orders will appear here</p>
              </div>
            ) : (
              <div className="glass rounded-xl p-4">
                <div className="space-y-4">
                  {changes.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/50">
                      <div className={`p-2 rounded-lg ${
                        change.action.includes('approved') ? 'bg-green-500/20' :
                        change.action.includes('rejected') ? 'bg-red-500/20' :
                        change.action.includes('created') ? 'bg-cyan-500/20' : 'bg-slate-700'
                      }`}>
                        {change.action.includes('approved') ? <Check className="w-4 h-4 text-green-400" /> :
                         change.action.includes('rejected') ? <X className="w-4 h-4 text-red-400" /> :
                         change.action.includes('created') ? <ShoppingCart className="w-4 h-4 text-cyan-400" /> :
                         <FileText className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">Order #{change.order_id}</span>
                          <span className="text-xs text-slate-500">{change.item_name}</span>
                          <span className="text-xs text-slate-600">{change.store_name}</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">{change.details}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-cyan-400">{change.by}</span>
                          <span className="text-xs text-slate-500">({change.role})</span>
                          <span className="text-xs text-slate-600">{formatTime(change.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-cyan-400" />
              Logistics Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map(member => (
                <div key={member.id} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.designation}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">{member.role}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${member.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDER DETAIL MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Order #{selectedOrder.id}</h3>
                  <button onClick={() => { setSelectedOrder(null); setApprovalComments(''); }} className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-400">Item</p>
                    <p className="text-white font-medium">{selectedOrder.item_name}</p>
                    <p className="text-xs text-slate-500">{selectedOrder.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Store</p>
                    <p className="text-white font-medium">{selectedOrder.store_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Quantity</p>
                    <p className="text-white font-medium">{selectedOrder.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Estimated Cost</p>
                    <p className="text-cyan-400 font-bold">{formatCurrency(selectedOrder.estimated_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Priority</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[selectedOrder.priority]}`}>
                      {selectedOrder.priority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    {(() => {
                      const cfg = statusConfig[selectedOrder.status] || statusConfig.pending_logistics;
                      const StatusIcon = cfg.icon;
                      return <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Requested By</p>
                    <p className="text-white">{selectedOrder.created_by}</p>
                    <p className="text-xs text-slate-500">{selectedOrder.created_by_role} &bull; {selectedOrder.created_by_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Created</p>
                    <p className="text-white">{formatTime(selectedOrder.created_at)}</p>
                  </div>
                </div>

                {/* Approval Chain */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Approval Chain</h4>
                  <div className="space-y-3">
                    {selectedOrder.approval_chain.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${
                        step.status === 'approved' ? 'bg-green-500/10 border border-green-500/30' :
                        step.status === 'rejected' ? 'bg-red-500/10 border border-red-500/30' :
                        'bg-slate-800 border border-slate-700'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === 'approved' ? 'bg-green-500/20' :
                          step.status === 'rejected' ? 'bg-red-500/20' : 'bg-slate-700'
                        }`}>
                          {step.status === 'approved' ? <Check className="w-4 h-4 text-green-400" /> :
                           step.status === 'rejected' ? <X className="w-4 h-4 text-red-400" /> :
                           <Clock className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            Step {step.step}: {step.role === 'logistics_head' ? 'Logistics Review' : 'VP Final Approval'}
                          </p>
                          <p className="text-xs text-slate-400">{step.name} {step.timestamp ? `(${formatTime(step.timestamp)})` : ''}</p>
                          {step.comments && <p className="text-xs text-slate-300 mt-1">"{step.comments}"</p>}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          step.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          step.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">History</h4>
                  <div className="space-y-2">
                    {selectedOrder.history.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                        <div>
                          <span className="text-slate-300">{entry.details}</span>
                          <span className="text-xs text-slate-500 ml-2">{entry.by} &bull; {formatTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {(selectedOrder.status === 'pending_logistics' || selectedOrder.status === 'pending_vp_approval' ||
                  selectedOrder.status === 'approved' || selectedOrder.status === 'in_transit') && (
                  <div className="border-t border-slate-700 pt-4">
                    <div className="mb-3">
                      <label className="block text-sm text-slate-400 mb-1">Comments</label>
                      <textarea value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm"
                        rows={2} placeholder="Add comments..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === 'pending_logistics' && (
                        <>
                          <button onClick={() => handleLogisticsReview(selectedOrder.id, 'approved')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            <Check className="w-4 h-4" /> Logistics Approve
                          </button>
                          <button onClick={() => handleLogisticsReview(selectedOrder.id, 'rejected')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      {selectedOrder.status === 'pending_vp_approval' && isSuperAdmin && (
                        <>
                          <button onClick={() => handleVPApproval(selectedOrder.id, 'approved')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            <Shield className="w-4 h-4" /> VP Approve (Final)
                          </button>
                          <button onClick={() => handleVPApproval(selectedOrder.id, 'rejected')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                            <X className="w-4 h-4" /> VP Reject
                          </button>
                        </>
                      )}
                      {selectedOrder.status === 'approved' && (
                        <button onClick={() => handleShip(selectedOrder.id)} disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          <Truck className="w-4 h-4" /> Mark Shipped
                        </button>
                      )}
                      {selectedOrder.status === 'in_transit' && (
                        <button onClick={() => handleDeliver(selectedOrder.id)} disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                          <Package className="w-4 h-4" /> Mark Delivered
                        </button>
                      )}
                      {(selectedOrder.status as string) !== 'delivered' && (selectedOrder.status as string) !== 'cancelled' && (selectedOrder.status as string) !== 'rejected' && (
                        <button onClick={() => handleCancel(selectedOrder.id)} disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CREATE ORDER MODAL */}
        {showCreateOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl w-full max-w-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-cyan-400" />
                    New Procurement Order
                  </h3>
                  <button onClick={() => setShowCreateOrder(false)} className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Item Name *</label>
                    <input type="text" value={newOrder.item_name}
                      onChange={(e) => setNewOrder(p => ({ ...p, item_name: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white"
                      placeholder="e.g., Fresh Milk 1L"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Category</label>
                      <select value={newOrder.category}
                        onChange={(e) => setNewOrder(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white">
                        {['Dairy', 'Beverages', 'Bakery', 'Fruits', 'Vegetables', 'Meat', 'Frozen Foods', 'Household', 'General'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Store</label>
                      <select value={newOrder.store_id}
                        onChange={(e) => {
                          const s = stores.find(st => st.id === parseInt(e.target.value));
                          setNewOrder(p => ({ ...p, store_id: parseInt(e.target.value), store_name: s?.name || '' }));
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white">
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Quantity</label>
                      <input type="number" value={newOrder.quantity}
                        onChange={(e) => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white" min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Unit Cost (AED)</label>
                      <input type="number" value={newOrder.unit_cost}
                        onChange={(e) => setNewOrder(p => ({ ...p, unit_cost: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white" min={0} step={0.5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Priority</label>
                      <select value={newOrder.priority}
                        onChange={(e) => setNewOrder(p => ({ ...p, priority: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white">
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Estimated Cost</label>
                    <p className="text-2xl font-bold text-cyan-400">
                      {formatCurrency(newOrder.quantity * newOrder.unit_cost)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Reason</label>
                    <input type="text" value={newOrder.reason}
                      onChange={(e) => setNewOrder(p => ({ ...p, reason: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white"
                      placeholder="Reason for procurement"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Notes</label>
                    <textarea value={newOrder.notes}
                      onChange={(e) => setNewOrder(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm"
                      rows={2} placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowCreateOrder(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
                    Cancel
                  </button>
                  <button onClick={handleCreateOrder}
                    disabled={!newOrder.item_name || newOrder.quantity < 1 || actionLoading}
                    className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Order
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-3 text-center">
                  Order will be sent to Logistics Head for review, then to Senior VP (Yash) for final approval.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
