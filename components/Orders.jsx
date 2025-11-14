'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getSettings } from '@/lib/actions/settings';
// Status configuration with colors
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
   const [restaurantSettings, setRestaurantSettings] = useState(null)
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  
  // Date range filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [orderType, setOrderType] = useState('All');

  // Debounce search
  const searchTimeoutRef = useRef(null);

const loadRestaurantSettings = async () => {
  try {
    const response = await getSettings()
    if (response.success) {
      setRestaurantSettings(response.data)
     
    }
  } catch (error) {
    console.error('Error loading restaurant settings:', error)
  }
}

  // Fetch initial orders (100 most recent)
  useEffect(() => {
    fetchInitialOrders();
       loadRestaurantSettings() 
  }, []);

  const fetchInitialOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { getOrders } = await import('@/lib/actions/orders');
      
      const result = await getOrders({ limit: 100 });
      
      if (result.success) {
        setOrders(result.data);
        setAllOrders(result.data);
        setTotalPages(Math.ceil(result.data.length / itemsPerPage));
      } else {
        setError(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Search with filters
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() && !dateFrom && !dateTo && statusFilter === 'All' && orderType === 'All') {
      setOrders(allOrders);
      return;
    }

    try {
      setIsSearching(true);
      const { getOrders } = await import('@/lib/actions/orders');
      
      const filters = {};
      if (dateFrom) filters.startDate = dateFrom;
      if (dateTo) filters.endDate = dateTo;
      if (statusFilter !== 'All') filters.status = statusFilter.toLowerCase();
      if (orderType !== 'All') filters.orderType = orderType.toLowerCase();
      
      const result = await getOrders(filters);
      
      if (result.success) {
        let filtered = result.data;
        
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            order =>
              order.orderNumber?.toLowerCase().includes(query) ||
              order.customerName?.toLowerCase().includes(query) ||
              order.tableNumber?.toLowerCase().includes(query)
          );
        }
        
        setOrders(filtered);
        setAllOrders(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error searching orders:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, dateFrom, dateTo, statusFilter, orderType, allOrders, itemsPerPage]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else if (!dateFrom && !dateTo && statusFilter === 'All' && orderType === 'All') {
        setOrders(allOrders);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch, dateFrom, dateTo, statusFilter, orderType, allOrders]);

  // Apply filters when changed
  useEffect(() => {
    performSearch();
  }, [dateFrom, dateTo, statusFilter, orderType]);

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    avgOrder: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0,
  };

  // Paginated and sorted orders
  const displayedOrders = React.useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [orders, sortOrder, currentPage, itemsPerPage]);

  // Handle refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInitialOrders();
    handleClearFilters();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setOrderType('All');
    setDateFrom('');
    setDateTo('');
    setSortOrder('desc');
    setCurrentPage(1);
    setOrders(allOrders);
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
  };

  // Open order details modal
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
        setOrders(prev => prev.map(o => o._id === orderId ? result.data : o));
        setAllOrders(prev => prev.map(o => o._id === orderId ? result.data : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(result.data);
        }
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
        await fetchInitialOrders();
        setIsModalOpen(false);
      } else {
        alert(result.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order');
    }
  };

  // Print bill
  const handlePrint = () => {
    window.print();
  };

  // Get active filters count
  const activeFiltersCount = [
    statusFilter !== 'All',
    orderType !== 'All',
    dateFrom,
    dateTo,
    searchQuery.trim(),
  ].filter(Boolean).length;

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#10b981] animate-spin mx-auto mb-4" />
          <p className="text-[#64748b] text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Error Loading Orders</h2>
          <p className="text-[#64748b] mb-6">{error}</p>
          <button
            onClick={fetchInitialOrders}
            className="px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1e293b] mb-2 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-[#10b981]" />
              Orders Management
            </h1>
            <p className="text-sm md:text-base text-[#64748b]">
              Track and manage all customer orders
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={handleExport}
              disabled={orders.length === 0}
              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-md text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-l-4 border-[#10b981]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748b] text-xs md:text-sm mb-1">Total</p>
                <p className="text-xl md:text-3xl font-bold text-[#1e293b]">{stats.total}</p>
              </div>
              <div className="bg-[#10b981] p-2 md:p-3 rounded-xl">
                <ShoppingBag className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-l-4 border-[#f59e0b]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748b] text-xs md:text-sm mb-1">Pending</p>
                <p className="text-xl md:text-3xl font-bold text-[#1e293b]">{stats.pending}</p>
              </div>
              <div className="bg-[#f59e0b] p-2 md:p-3 rounded-xl">
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-l-4 border-[#3b82f6]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748b] text-xs md:text-sm mb-1">Preparing</p>
                <p className="text-xl md:text-3xl font-bold text-[#1e293b]">{stats.preparing}</p>
              </div>
              <div className="bg-[#3b82f6] p-2 md:p-3 rounded-xl">
                <Utensils className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-l-4 border-[#10b981]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748b] text-xs md:text-sm mb-1">Completed</p>
                <p className="text-xl md:text-3xl font-bold text-[#1e293b]">{stats.completed}</p>
              </div>
              <div className="bg-[#10b981] p-2 md:p-3 rounded-xl">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-l-4 border-[#8b5cf6]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748b] text-xs md:text-sm mb-1">Revenue</p>
                <p className="text-lg md:text-2xl font-bold text-[#1e293b]">₨{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-[#8b5cf6] p-2 md:p-3 rounded-xl">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border-l-4 border-[#06b6d4]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748b] text-xs md:text-sm mb-1">Avg Order</p>
                <p className="text-lg md:text-2xl font-bold text-[#1e293b]">₨{stats.avgOrder}</p>
              </div>
              <div className="bg-[#06b6d4] p-2 md:p-3 rounded-xl">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Advanced Filters Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6"
        >
          {/* Main Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search by Order #, Customer, Table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-sm md:text-base"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10b981] animate-spin" />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3 flex-wrap w-full lg:w-auto">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-[#10b981] rounded-full text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-[#f1f5f9] text-[#475569] rounded-lg hover:bg-[#e2e8f0] transition-all font-medium text-sm md:text-base"
              >
                <ArrowUpDown className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 md:p-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all shadow-md ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                aria-label="Refresh orders"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Expandable Filter Section */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-[#e2e8f0]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date From */}
                    <div>
                      <label className="block text-[#475569] font-medium mb-2 text-sm">
                        <CalendarRange className="w-4 h-4 inline mr-1" />
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-sm"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="block text-[#475569] font-medium mb-2 text-sm">
                        <CalendarRange className="w-4 h-4 inline mr-1" />
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-sm"
                      />
                    </div>

                    {/* Order Type */}
                    <div>
                      <label className="block text-[#475569] font-medium mb-2 text-sm">
                        <Filter className="w-4 h-4 inline mr-1" />
                        Order Type
                      </label>
                      <div className="relative">
                        <select
                          value={orderType}
                          onChange={(e) => setOrderType(e.target.value)}
                          className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] appearance-none text-sm"
                        >
                          <option value="All">All Types</option>
                          <option value="dine-in">Dine-in</option>
                          <option value="takeaway">Takeaway</option>
                          <option value="delivery">Delivery</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <button
                        onClick={handleClearFilters}
                        disabled={activeFiltersCount === 0}
                        className="w-full px-4 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Status Filter Pills */}
                  <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                    <p className="text-[#475569] font-medium mb-3 text-sm">Status:</p>
                    <div className="flex gap-2 flex-wrap">
                      {['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                            statusFilter === status
                              ? 'bg-[#10b981] text-white shadow-md'
                              : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Summary & Pagination */}
          <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[#64748b] text-xs md:text-sm">
              Showing <span className="font-bold text-[#10b981]">{displayedOrders.length}</span> of{' '}
              <span className="font-bold text-[#1e293b]">{orders.length}</span> orders
              {(dateFrom || dateTo) && (
                <span className="ml-2 text-xs">
                  {dateFrom && <span>from <span className="font-semibold">{dateFrom}</span></span>}
                  {dateFrom && dateTo && ' '}
                  {dateTo && <span>to <span className="font-semibold">{dateTo}</span></span>}
                </span>
              )}
            </p>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[#64748b] px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Orders Table - Desktop View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Type / Table
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {displayedOrders.map((order, index) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const orderTypeInfo = orderTypeConfig[order.orderType] || orderTypeConfig['dine-in'];
                    
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all"
                      >
                        <td className="px-6 py-4 font-bold text-[#1e293b]">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 text-[#475569]">
                          {order.customerName || 'Guest'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ 
                              backgroundColor: `${orderTypeInfo.color}20`,
                              color: orderTypeInfo.color 
                            }}>
                              {orderTypeInfo.icon} {orderTypeInfo.label}
                              {order.tableNumber && order.orderType === 'dine-in' && ` ${order.tableNumber}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#10b981] text-lg">
                          ₨{order.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[#64748b]">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm font-medium">{order.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: status.bgColor,
                              color: status.textColor,
                            }}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#64748b] text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.orderDate)}
                            </span>
                            <span className="text-xs text-[#94a3b8] flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(order.orderDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium text-sm shadow-md hover:shadow-lg"
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

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <p className="text-sm text-[#64748b]">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[#64748b] px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Orders Cards - Mobile View */}
        <div className="md:hidden space-y-4">
          <AnimatePresence mode="popLayout">
            {displayedOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const orderTypeInfo = orderTypeConfig[order.orderType] || orderTypeConfig['dine-in'];
              
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl shadow-sm p-5 border-l-4"
                  style={{ borderLeftColor: status.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="font-bold text-[#1e293b] text-base mb-1">{order.orderNumber}</p>
                      <p className="text-sm text-[#64748b]">{order.customerName || 'Guest'}</p>
                      <p className="text-xs text-[#94a3b8] mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.orderDate)} • <Clock className="w-3 h-3" /> {formatTime(order.orderDate)}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: status.bgColor,
                        color: status.textColor,
                      }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">Type:</span>
                      <span className="font-medium text-[#1e293b]">
                        {orderTypeInfo.icon} {orderTypeInfo.label}
                        {order.tableNumber && order.orderType === 'dine-in' && ` ${order.tableNumber}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">Payment:</span>
                      <span className="font-medium text-[#1e293b]">{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-[#f1f5f9]">
                      <span className="text-[#64748b] font-medium text-sm">Total:</span>
                      <span className="font-bold text-[#10b981] text-lg">
                        ₨{order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewOrder(order)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-[#f1f5f9] text-[#475569] rounded-lg hover:bg-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-[#64748b] font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-[#f1f5f9] text-[#475569] rounded-lg hover:bg-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {displayedOrders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl"
          >
            <ShoppingBag className="w-16 h-16 md:w-20 md:h-20 text-[#cbd5e1] mx-auto mb-4" />
            <p className="text-[#64748b] text-base md:text-lg font-medium">No orders found</p>
            <p className="text-[#94a3b8] text-sm mt-2">
              {activeFiltersCount > 0 ? 'Try adjusting your search or filters' : 'No orders available yet'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium"
              >
                Clear All Filters
              </button>
            )}
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#10b981] to-[#059669] text-white p-4 md:p-6 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                    {selectedOrder.orderNumber}
                  </h2>
                  <p className="text-[#d1fae5] text-xs md:text-sm mt-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                    {formatDate(selectedOrder.orderDate)} • <Clock className="w-3 h-3 md:w-4 md:h-4" /> {formatTime(selectedOrder.orderDate)}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Order Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-4 rounded-xl">
                    <p className="text-[#3b82f6] text-xs font-medium mb-1">Customer</p>
                    <p className="font-bold text-[#1e293b] text-base md:text-lg">{selectedOrder.customerName || 'Guest'}</p>
                    {selectedOrder.phoneNumber && (
                      <p className="text-xs text-[#64748b] mt-1">📞 {selectedOrder.phoneNumber}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] p-4 rounded-xl">
                    <p className="text-[#d97706] text-xs font-medium mb-1">Order Type</p>
                    <p className="font-bold text-[#1e293b] text-base md:text-lg">
                      {orderTypeConfig[selectedOrder.orderType]?.icon} {orderTypeConfig[selectedOrder.orderType]?.label}
                    </p>
                    {selectedOrder.tableNumber && (
                      <p className="text-xs text-[#64748b] mt-1">Table: {selectedOrder.tableNumber}</p>
                    )}
                    {selectedOrder.address && (
                      <p className="text-xs text-[#64748b] mt-1">📍 {selectedOrder.address}</p>
                    )}
                  </div>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: `linear-gradient(to bottom right, ${statusConfig[selectedOrder.status]?.bgColor}, ${statusConfig[selectedOrder.status]?.color}20)`,
                    }}
                  >
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: statusConfig[selectedOrder.status]?.textColor }}
                    >
                      Status
                    </p>
                    <p className="font-bold text-[#1e293b] text-base md:text-lg flex items-center gap-2">
                      {React.createElement(statusConfig[selectedOrder.status]?.icon, {
                        className: 'w-4 h-4 md:w-5 md:h-5',
                        style: { color: statusConfig[selectedOrder.status]?.textColor },
                      })}
                      {statusConfig[selectedOrder.status]?.label}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-[#f8fafc] p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-[#64748b]" />
                      <span className="font-medium text-[#475569] text-sm md:text-base">Payment Method:</span>
                    </div>
                    <span className="font-bold text-[#1e293b] text-sm md:text-base">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#475569] text-sm md:text-base">Payment Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.paymentStatus === 'paid' 
                        ? 'bg-[#d1fae5] text-[#059669]' 
                        : 'bg-[#fee2e2] text-[#dc2626]'
                    }`}>
                      {selectedOrder.paymentStatus === 'paid' ? '✓ Paid' : '⏱ Pending'}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-[#1e293b] mb-3 md:mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
                    Order Items ({selectedOrder.items.length})
                  </h3>
                  <div className="space-y-2 md:space-y-3 max-h-64 overflow-y-auto">
                    {selectedOrder.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 md:gap-3 flex-1">
                          <span className="text-xl md:text-2xl">{item.icon || '🍽️'}</span>
                          <div>
                            <p className="font-medium text-[#1e293b] text-sm md:text-base">{item.name}</p>
                            <p className="text-xs md:text-sm text-[#64748b] mt-0.5 md:mt-1">
                              ₨{item.price} × {item.quantity}
                            </p>
                            <p className="text-xs text-[#94a3b8]">{item.category}</p>
                          </div>
                        </div>
                        <p className="font-bold text-[#1e293b] text-base md:text-lg">
                          ₨{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-[#fef3c7] p-4 rounded-xl border-l-4 border-[#f59e0b]">
                    <p className="text-[#d97706] text-sm font-medium mb-1">📝 Order Notes:</p>
                    <p className="text-[#475569] text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Bill Summary */}
                <div className="bg-gradient-to-br from-[#10b981]/10 via-[#8b5cf6]/10 to-[#3b82f6]/10 p-4 md:p-6 rounded-xl border-2 border-[#10b981]/20">
                  <h3 className="text-base md:text-lg font-semibold text-[#1e293b] mb-3 md:mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
                    Bill Summary
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center text-sm md:text-base">
                      <span className="text-[#64748b]">Subtotal:</span>
                      <span className="font-semibold text-[#1e293b]">
                        ₨{selectedOrder.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-[#ef4444] text-sm md:text-base">
                        <span>Discount ({selectedOrder.discountPercentage}%):</span>
                        <span className="font-semibold">-₨{selectedOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm md:text-base">
                      <span className="text-[#64748b]">Tax ({selectedOrder.taxPercentage}%):</span>
                      <span className="font-semibold text-[#1e293b]">
                        ₨{selectedOrder.tax.toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.deliveryCharge > 0 && (
                      <div className="flex justify-between items-center text-sm md:text-base">
                        <span className="text-[#64748b]">Delivery Charge:</span>
                        <span className="font-semibold text-[#1e293b]">
                          ₨{selectedOrder.deliveryCharge.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 md:pt-3 border-t-2 border-[#10b981]/30">
                      <span className="font-bold text-[#1e293b] text-base md:text-lg">Grand Total:</span>
                      <span className="font-bold text-[#10b981] text-xl md:text-2xl">
                        ₨{selectedOrder.total.toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.totalProfit !== undefined && (
                      <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]">
                        <span className="text-[#64748b] text-xs md:text-sm">Profit:</span>
                        <span className="font-bold text-[#8b5cf6] text-base md:text-lg">
                          ₨{selectedOrder.totalProfit.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update */}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <div className="bg-[#f8fafc] p-4 rounded-xl">
                    <label className="block text-[#475569] font-medium mb-3 text-sm flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Update Order Status
                    </label>
                    <div className="relative">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] appearance-none font-medium text-sm md:text-base"
                        style={{
                          color: statusConfig[selectedOrder.status]?.textColor,
                        }}
                      >
                        <option value="pending">⏱️ Pending - Waiting to start</option>
                        <option value="preparing">🍳 Preparing - Kitchen is cooking</option>
                        <option value="ready">📦 Ready - Order is ready</option>
                        <option value="completed">✅ Completed - Order delivered</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8] pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                  <button
                    onClick={handlePrint}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-lg flex items-center justify-center gap-2 hover:shadow-xl text-sm md:text-base"
                  >
                    <Printer className="w-4 h-4 md:w-5 md:h-5" />
                    Print Bill
                  </button>
                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder._id)}
                      className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-all font-medium shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all font-medium text-sm md:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thermal Receipt Print Style */}
      {selectedOrder && (
        <div className="hidden print:block print-receipt">
          <div className="receipt-container">
            {/* Header */}
            <div className="text-center mb-3 border-b-2 border-dashed border-black pb-3">
                  <h1 className="text-2xl font-bold mb-1 uppercase">{restaurantSettings?.restaurantName || 'RESTAURANT'}</h1>
                  <p className="text-xs">{restaurantSettings?.address || ''}</p>
                  <p className="text-xs"> {restaurantSettings?.phone1 || ''}{restaurantSettings?.phone2 ? ` | ${restaurantSettings.phone2}` : ''}</p>
                  <p className="text-xs mt-1">BILL RECEIPT</p>
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
                  {selectedOrder.items.map((item, index) => (
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
                <span>₨{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
           { selectedOrder.tax > 0 &&  <div className="flex justify-between mb-1">
                <span>Service Charges ({selectedOrder.taxPercentage}%):</span>
                <span>₨{selectedOrder.tax.toFixed(2)}</span>
              </div>}
              {selectedOrder.deliveryCharge > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Delivery Charges:</span>
                  <span>₨{selectedOrder.deliveryCharge.toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.discountPercentage > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Discount ({selectedOrder.discountPercentage}%):</span>
                  <span>-₨{selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-black pt-1 mt-1">
                <span>TOTAL:</span>
                <span>₨{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
                           <div className="text-center text-xs border-t border-dashed border-black pt-3">
                  <p className="mb-2 font-bold">{restaurantSettings?.footerMessage || 'Thank You for Dining with Us!'}</p>
                  <p className="mb-1">Please visit again</p>
                  <p className="text-[10px]  mt-2">Print Time:{new Date().toLocaleString()}</p>
<div className="mt-3 pt-2 border-t text-center border-black">
  <p className="text-[10px] font-semibold">
    SOFTWARE BY: M. AMMAR SHAIKH
  </p>
  <p className="text-[9px]">
    Tel: 0316-0346330 | 0370-2741544
  </p>
</div>
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