'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Printer,
  Clock,
  CreditCard,
  Utensils,
  Package,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  Download,
  ArrowUpDown,
  CalendarRange,
  SlidersHorizontal,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Menu,
} from 'lucide-react';

// Status configuration
const statusConfig = {
  pending: {
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#d97706',
    icon: Clock,
    label: 'Pending',
  },
  preparing: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#2563eb',
    icon: Utensils,
    label: 'Preparing',
  },
  ready: {
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    textColor: '#7c3aed',
    icon: Package,
    label: 'Ready',
  },
  completed: {
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#059669',
    icon: CheckCircle,
    label: 'Completed',
  },
  cancelled: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#dc2626',
    icon: XCircle,
    label: 'Cancelled',
  },
};

// Order type configuration
const orderTypeConfig = {
  'dine-in': { icon: '🪑', label: 'Dine-in', color: '#3b82f6' },
  'takeaway': { icon: '🛍️', label: 'Takeaway', color: '#d97706' },
  'delivery': { icon: '🚗', label: 'Delivery', color: '#7c3aed' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orderType, setOrderType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    completed: 0,
    revenue: 0,
    avgOrder: 0,
  });

  // Fetch orders with pagination
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Import server action
      const { getOrders } = await import('@/lib/actions/orders');
      
      // Build filters object
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        sortOrder,
      };
      
      if (statusFilter !== 'All') filters.status = statusFilter.toLowerCase();
      if (orderType !== 'All') filters.orderType = orderType.toLowerCase();
      if (dateFrom) filters.startDate = dateFrom;
      if (dateTo) filters.endDate = dateTo;
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      
      const result = await getOrders(filters);
      
      if (result.success) {
        setOrders(result.data || []);
        setTotalOrders(result.totalCount || 0);
        setTotalPages(result.totalPages || 0);
        
        // Set stats if provided by server
        if (result.stats) {
          setStats(result.stats);
        }
      } else {
        setError(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, orderType, dateFrom, dateTo, searchQuery, sortOrder]);

  // Fetch orders on mount and when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Clear filters and reset to page 1
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setOrderType('All');
    setDateFrom('');
    setDateTo('');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ['Order Number', 'Customer', 'Type', 'Table', 'Total', 'Payment', 'Status', 'Date', 'Time'],
      ...orders.map(order => {
        const date = new Date(order.orderDate);
        return [
          order.orderNumber,
          order.customerName || 'Guest',
          orderTypeConfig[order.orderType]?.label || order.orderType,
          order.tableNumber || '-',
          order.total,
          order.paymentMethod,
          statusConfig[order.status]?.label || order.status,
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
        ];
      }),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => 
    [
      statusFilter !== 'All',
      orderType !== 'All',
      dateFrom,
      dateTo,
      searchQuery.trim(),
    ].filter(Boolean).length,
    [statusFilter, orderType, dateFrom, dateTo, searchQuery]
  );

  // Format functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const { updateOrderStatus } = await import('@/lib/actions/orders');
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        // Update local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
        // Refresh to update stats
        fetchOrders();
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const { cancelOrder } = await import('@/lib/actions/orders');
      const result = await cancelOrder(orderId);
      
      if (result.success) {
        setIsModalOpen(false);
        fetchOrders();
      } else {
        alert(result.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order');
    }
  };

  // Handle filter changes - reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, orderType, dateFrom, dateTo, searchQuery, sortOrder]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"
        >
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Orders</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium shadow-lg"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-emerald-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Orders</h1>
              <p className="text-xs text-slate-500">{totalOrders} total</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Actions</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleExport();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-all font-medium"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
                
                <button
                  onClick={() => {
                    handleRefresh();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      handleClearFilters();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        {/* Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              Orders Management
            </h1>
            <p className="text-slate-600 text-lg">
              Track and manage all customer orders efficiently
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={orders.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-6 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: ShoppingBag, color: 'from-emerald-400 to-emerald-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-400 to-orange-500' },
            { label: 'Preparing', value: stats.preparing, icon: Utensils, color: 'from-blue-400 to-blue-600' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'from-emerald-400 to-green-600' },
            { 
              label: 'Revenue', 
              value: stats.revenue >= 1000 ? `₨${(stats.revenue / 1000).toFixed(1)}k` : `₨${stats.revenue}`, 
              icon: TrendingUp, 
              color: 'from-violet-400 to-purple-600' 
            },
            { label: 'Avg Order', value: `₨${stats.avgOrder}`, icon: DollarSign, color: 'from-cyan-400 to-blue-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs lg:text-sm mb-1 font-medium">{stat.label}</p>
                  <p className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 lg:p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                  <stat.icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm mb-6 border border-slate-100"
        >
          {/* Search and Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, customers, tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all text-slate-800"
              />
            </div>

            <div className="hidden lg:flex gap-3">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-emerald-600 rounded-full text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium"
              >
                <ArrowUpDown className="w-5 h-5" />
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                isFilterOpen || activeFiltersCount > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {isFilterOpen ? 'Hide' : 'Show'} Filters
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white text-emerald-600 rounded-full text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-slate-200 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">From Date</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">To Date</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-2 text-sm">Order Type</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="All">All Types</option>
                        <option value="dine-in">Dine-in</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleClearFilters}
                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          statusFilter === status
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-slate-600 text-sm">
                Showing <span className="font-bold text-emerald-600">{orders.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalOrders}</span> orders
              </p>
              
              {/* Items per page - Desktop only */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-slate-600">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && orders.length > 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Orders List - Mobile Cards */}
        <div className="lg:hidden space-y-3 mb-6">
          <AnimatePresence>
            {orders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const orderTypeInfo = orderTypeConfig[order.orderType] || orderTypeConfig['dine-in'];
              
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-lg">{order.orderNumber}</p>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: status.bgColor, color: status.textColor }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{order.customerName || 'Guest'}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.orderDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(order.orderDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Type</p>
                      <p className="text-sm font-medium text-slate-800">
                        {orderTypeInfo.icon} {orderTypeInfo.label}
                      </p>
                      {order.tableNumber && <p className="text-xs text-slate-500">{order.tableNumber}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Payment</p>
                      <p className="text-sm font-medium text-slate-800">{order.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                        ₨{order.total.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Orders Table - Desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Order #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {orders.map((order, index) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const orderTypeInfo = orderTypeConfig[order.orderType] || orderTypeConfig['dine-in'];
                    
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                      >
                        <td className="px-6 py-4 font-bold text-slate-800">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-slate-600">{order.customerName || 'Guest'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
                            {orderTypeInfo.icon} {orderTypeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600 text-lg">₨{order.total.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm">{order.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: status.bgColor, color: status.textColor }}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(order.orderDate)}</span>
                            <span className="text-xs text-slate-400">{formatTime(order.orderDate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-slate-100"
          >
            <ShoppingBag className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium mb-2">No orders found</p>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your filters or search criteria</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Clear All Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mt-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentPage === 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {(() => {
                const pages = [];
                const showPages = 5;
                let start = Math.max(1, currentPage - Math.floor(showPages / 2));
                let end = Math.min(totalPages, start + showPages - 1);
                
                if (end - start < showPages - 1) {
                  start = Math.max(1, end - showPages + 1);
                }

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`w-10 h-10 rounded-xl font-medium transition-all ${
                        currentPage === i
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentPage === totalPages
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-3xl z-10 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6" />
                      {selectedOrder.orderNumber}
                    </h2>
                    <p className="text-emerald-100 text-sm mt-1">
                      {formatDate(selectedOrder.orderDate)} • {formatTime(selectedOrder.orderDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Order Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                    <p className="text-blue-600 text-xs font-medium mb-1">Customer</p>
                    <p className="font-bold text-slate-800 text-lg">{selectedOrder.customerName || 'Guest'}</p>
                    {selectedOrder.phoneNumber && (
                      <p className="text-xs text-slate-600 mt-1">📞 {selectedOrder.phoneNumber}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-2xl border border-amber-200">
                    <p className="text-amber-600 text-xs font-medium mb-1">Order Type</p>
                    <p className="font-bold text-slate-800 text-lg">
                      {orderTypeConfig[selectedOrder.orderType]?.icon} {orderTypeConfig[selectedOrder.orderType]?.label}
                    </p>
                    {selectedOrder.tableNumber && selectedOrder.orderType === 'dine-in' && (
                      <p className="text-xs text-slate-600 mt-1">Table: {selectedOrder.tableNumber}</p>
                    )}
                    {selectedOrder.address && (
                      <p className="text-xs text-slate-600 mt-1">📍 {selectedOrder.address}</p>
                    )}
                  </div>
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: `linear-gradient(to bottom right, ${statusConfig[selectedOrder.status]?.bgColor}, white)`,
                      borderColor: statusConfig[selectedOrder.status]?.color,
                    }}
                  >
                    <p className="text-xs font-medium mb-1" style={{ color: statusConfig[selectedOrder.status]?.textColor }}>
                      Status
                    </p>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {React.createElement(statusConfig[selectedOrder.status]?.icon, {
                        className: 'w-5 h-5',
                        style: { color: statusConfig[selectedOrder.status]?.textColor },
                      })}
                      {statusConfig[selectedOrder.status]?.label}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Method
                    </span>
                    <span className="font-bold text-slate-800">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm font-medium">Payment Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.paymentStatus === 'paid' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedOrder.paymentStatus === 'paid' ? '✓ Paid' : '⏱ Pending'}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-500" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedOrder.items?.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">{item.icon || '🍽️'}</span>
                          <div>
                            <p className="font-medium text-slate-800">{item.name}</p>
                            <p className="text-sm text-slate-500">₨{item.price} × {item.quantity}</p>
                            {item.category && <p className="text-xs text-slate-400">{item.category}</p>}
                          </div>
                        </div>
                        <p className="font-bold text-slate-800 text-lg">₨{(item.price * item.quantity).toLocaleString()}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                    <p className="text-amber-700 text-sm font-medium mb-1">📝 Order Notes:</p>
                    <p className="text-slate-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Bill Summary */}
                <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-violet-50 p-6 rounded-2xl border-2 border-emerald-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    Bill Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-800">₨{selectedOrder.subtotal?.toLocaleString()}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Discount ({selectedOrder.discountPercentage}%)</span>
                        <span className="font-semibold">-₨{selectedOrder.discount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Tax ({selectedOrder.taxPercentage}%)</span>
                      <span className="font-semibold text-slate-800">₨{selectedOrder.tax?.toLocaleString()}</span>
                    </div>
                    {selectedOrder.deliveryCharge > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Delivery Charge</span>
                        <span className="font-semibold text-slate-800">₨{selectedOrder.deliveryCharge?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-300">
                      <span className="font-bold text-slate-800 text-lg">Grand Total</span>
                      <span className="font-bold text-emerald-600 text-2xl">₨{selectedOrder.total?.toLocaleString()}</span>
                    </div>
                    {selectedOrder.totalProfit !== undefined && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-slate-600 text-sm">Profit</span>
                        <span className="font-bold text-violet-600 text-lg">₨{selectedOrder.totalProfit?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update */}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-slate-700 font-medium mb-3 text-sm">Update Order Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 font-medium"
                    >
                      <option value="pending">⏱️ Pending - Waiting to start</option>
                      <option value="preparing">🍳 Preparing - Kitchen is cooking</option>
                      <option value="ready">📦 Ready - Order is ready</option>
                      <option value="completed">✅ Completed - Order delivered</option>
                    </select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Print Bill
                  </button>
                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder._id)}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Receipt */}
      {selectedOrder && (
        <div className="hidden print:block print-receipt">
          <div className="receipt-container">
            {/* Header */}
            <div className="text-center mb-4 pb-3 border-b-2 border-dashed border-black">
              <h1 className="text-2xl font-bold mb-1">UNSA RESTAURANT</h1>
              <p className="text-xs">Allah Wala Chowk, Shikarpur</p>
              <p className="text-xs">0333-7275912 | 0333-7265025</p>
              <p className="text-xs mt-2">BILL</p>
            </div>

            {/* Order Info */}
            <div className="text-xs mb-3 pb-2 border-b border-dashed border-black">
              <div className="flex justify-between mb-1">
                <span>Invoice#:</span>
                <span className="font-bold">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Date:</span>
                <span>{new Date(selectedOrder.orderDate).toLocaleString('en-US', { 
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Type:</span>
                <span className="font-bold uppercase">{selectedOrder.orderType}</span>
              </div>
              {selectedOrder.orderType === 'dine-in' && selectedOrder.tableNumber && (
                <div className="flex justify-between mb-1">
                  <span>Table:</span>
                  <span className="font-bold">{selectedOrder.tableNumber}</span>
                </div>
              )}
              {selectedOrder.customerName && (
                <div className="flex justify-between mb-1">
                  <span>Customer:</span>
                  <span>{selectedOrder.customerName}</span>
                </div>
              )}
              {selectedOrder.phoneNumber && (
                <div className="flex justify-between mb-1">
                  <span>Phone:</span>
                  <span>{selectedOrder.phoneNumber}</span>
                </div>
              )}
              {selectedOrder.address && (
                <div className="mb-1">
                  <span>Address:</span>
                  <p className="text-xs mt-1">{selectedOrder.address}</p>
                </div>
              )}
              <div className="flex justify-between mb-1">
                <span>Payment:</span>
                <span className="font-bold">{selectedOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="text-xs mb-3">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => (
                    <tr key={index} className="border-b border-dashed border-gray-300">
                      <td className="py-1 text-xs">{item.name}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">{item.price}</td>
                      <td className="text-right py-1 font-bold">{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Summary */}
            <div className="text-xs mb-3 border-t-2 border-black pt-2">
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span>₨{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Service Charges ({selectedOrder.taxPercentage}%):</span>
                <span>₨{selectedOrder.tax?.toFixed(2)}</span>
              </div>
              {selectedOrder.deliveryCharge > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Delivery Charges:</span>
                  <span>₨{selectedOrder.deliveryCharge?.toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.discountPercentage > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Discount ({selectedOrder.discountPercentage}%):</span>
                  <span>-₨{selectedOrder.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-black pt-1 mt-1">
                <span>TOTAL:</span>
                <span>₨{selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs border-t border-dashed border-black pt-3">
              <p className="mb-2 font-bold">Thank You for Dining with Us!</p>
              <p className="mb-1">Please visit again</p>
              <p className="text-[10px] mt-2">Print Time: {new Date().toLocaleString()}</p>
              <p className="text-xs mt-3 border-t border-dashed border-black pt-2">
                Software developed by
              </p>
              <p>Dev: M.Ammar Shaikh</p>
              <p className="text-xs">03160346330 | 03702741544</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-receipt,
          .print-receipt * {
            visibility: visible;
          }
          
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          
          .receipt-container {
            width: 80mm;
            max-width: 80mm;
            margin: 0;
            padding: 10mm;
            font-family: 'Courier New', monospace;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.4;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}