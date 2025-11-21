'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Download,
  Calendar,
  Clock,
  Trophy,
  Package,
  BarChart3,
  LineChart as LineChartIcon,
  FileText,
  Utensils,
  ShoppingBag,
  Truck,
  Loader2,
  Users,
  Phone,
  MapPin,
  Award,
  Star,
  Crown,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingDown,
  MoreHorizontal,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Add these imports at the very top of your component file
import { getReportsData } from '@/lib/actions/reports';
import { getTopCustomers } from '@/lib/actions/customers';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f43f5e'];

export default function ProfessionalReportsPage() {
  const [reportType, setReportType] = useState('This Week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');
  const [customRange, setCustomRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter states
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSortBy, setItemSortBy] = useState('quantity');
  const [itemSortOrder, setItemSortOrder] = useState('desc');
  const [showAllItems, setShowAllItems] = useState(false);
  
  // Order filter states
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [ordersToShow, setOrdersToShow] = useState(50); // ADD THI
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    return () => {
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  useEffect(() => {
    if (reportType !== 'Custom Range') {
      fetchReportsData();
    }
  }, [reportType]);

const getDateFilters = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate, endDate;

  if (reportType === 'Today') {
    startDate = today;
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
  } else if (reportType === 'Yesterday') {
    // ADD THIS NEW BLOCK
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (reportType === 'This Week') {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
  }
  // ... rest of the function
    else if (reportType === 'This Month') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === 'Custom Range' && dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      const [startHour, startMinute] = timeFrom.split(':').map(Number);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      endDate = new Date(dateTo);
      const [endHour, endMinute] = timeTo.split(':').map(Number);
      endDate.setHours(endHour, endMinute, 59, 999);
    } else {
      return null;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = getDateFilters();
      
      if (!filters) {
        setError('Please select a valid date range');
        setLoading(false);
        return;
      }

   const [reportsResult, customersResult] = await Promise.all([
  getReportsData(filters),
  getTopCustomers(10)
]);

if (reportsResult.success) {
  setReportsData(reportsResult.data);
}
if (customersResult.success) {
  setTopCustomers(customersResult.data);
}
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('An error occurred while fetching reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomReport = () => {
    if (!dateFrom || !dateTo) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('Start date must be before end date');
      return;
    }
    
    setError(null);
    fetchReportsData();
  };

const handleExportPDF = () => {
  if (!reportsData) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text('Restaurant Business Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Period: ${reportType}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Summary Statistics', 14, 45);
  
  const summaryData = [
    ['Total Revenue', `₨${reportsData.summary.totalRevenue.toLocaleString()}`],
    ['Total Profit', `₨${reportsData.summary.totalProfit.toLocaleString()}`],
    ['Total Orders', reportsData.summary.totalOrders.toString()],
    ['Completed Orders', (reportsData.summary.completedOrders || 0).toString()],
    ['Average Order Value', `₨${Math.round(reportsData.summary.averageOrderValue || 0).toLocaleString()}`],
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.save(`restaurant-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

  const getCustomerTierBadge = (totalSpent) => {
    if (totalSpent >= 50000) {
      return { label: 'VIP', color: 'from-yellow-500 to-orange-500', icon: Crown };
    } else if (totalSpent >= 20000) {
      return { label: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: Award };
    } else if (totalSpent >= 10000) {
      return { label: 'Silver', color: 'from-gray-400 to-gray-600', icon: Star };
    }
    return { label: 'Regular', color: 'from-blue-400 to-blue-600', icon: Users };
  };

  const getFilteredAndSortedItems = () => {
    if (!reportsData) return [];
    
    let items = [...reportsData.popularItems];
    
    if (itemSearchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(itemSearchTerm.toLowerCase())
      );
    }
    
    items.sort((a, b) => {
      let comparison = 0;
      
      switch (itemSortBy) {
        case 'quantity':
          comparison = b.totalQuantity - a.totalQuantity;
          break;
        case 'revenue':
          comparison = b.totalRevenue - a.totalRevenue;
          break;
        case 'profit':
          comparison = b.totalProfit - a.totalProfit;
          break;
        case 'margin':
          comparison = parseFloat(b.profitMargin) - parseFloat(a.profitMargin);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }
      
      return itemSortOrder === 'desc' ? comparison : -comparison;
    });
    
    return showAllItems ? items : items.slice(0, 8);
  };

const getFilteredOrders = useMemo(() => {
  if (!reportsData?.orders) return [];
  
  let filtered = [...reportsData.orders];
  
  if (orderSearchTerm) {
    filtered = filtered.filter(order => 
      order.orderNumber.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.phoneNumber?.includes(orderSearchTerm)
    );
  }
  
  if (orderStatusFilter !== 'all') {
    filtered = filtered.filter(order => order.status === orderStatusFilter);
  }
  
  if (orderTypeFilter !== 'all') {
    filtered = filtered.filter(order => order.orderType === orderTypeFilter);
  }
  
  if (orderPaymentFilter !== 'all') {
    filtered = filtered.filter(order => order.paymentMethod === orderPaymentFilter);
  }
  
  // CHANGE THIS LINE:
  return showAllOrders ? filtered : filtered.slice(0, ordersToShow);
}, [reportsData?.orders, orderSearchTerm, orderStatusFilter, orderTypeFilter, orderPaymentFilter, showAllOrders, ordersToShow]);

  const getOrderTypeIcon = (type) => {
    switch (type) {
      case 'dine-in': return Utensils;
      case 'takeaway': return ShoppingBag;
      case 'delivery': return Truck;
      default: return ShoppingCart;
    }
  };

  const getPaymentIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return Banknote;
      case 'card': return CreditCard;
      case 'online': return Smartphone;
      default: return DollarSign;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Completed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      preparing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle, label: 'Preparing' },
      ready: { bg: 'bg-purple-100', text: 'text-purple-700', icon: CheckCircle2, label: 'Ready' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Cancelled' },
    };
    return badges[status] || badges.pending;
  };
// Reset pagination when filters change
useEffect(() => {
  setOrdersToShow(50);
}, [orderSearchTerm, orderStatusFilter, orderTypeFilter, orderPaymentFilter, reportType]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-red-600 text-xl font-bold mb-2">Error Loading Data</p>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (reportType === 'Custom Range') {
                handleGenerateCustomReport();
              } else {
                fetchReportsData();
              }
            }}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportsData) return null;

  const { summary, chartData, orders, popularItems, insights } = reportsData;
  const filteredItems = getFilteredAndSortedItems();
  const filteredOrders = getFilteredOrders;

  const orderTypeChartData = [
    { name: 'Dine-In', value: summary.dineInOrders, revenue: summary.dineInRevenue },
    { name: 'Takeaway', value: summary.takeawayOrders, revenue: summary.takeawayRevenue },
    { name: 'Delivery', value: summary.deliveryOrders, revenue: summary.deliveryRevenue },
  ].filter(item => item.value > 0);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                Business Analytics
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {insights.totalUniqueItems} items • {summary.totalItems} units • {summary.totalOrders} orders
              </p>
            </div>
            
            <button
              onClick={handleExportPDF}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-slate-800">Report Period:</span>
              <div className="flex flex-wrap gap-2">
                {['Today', 'Yesterday','This Week', 'This Month', 'Custom Range'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      setCustomRange(type === 'Custom Range');
                      if (type === 'Custom Range') {
                        setTimeFrom('00:00');
                        setTimeTo('23:59');
                      }
                      setError(null);
                    }}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      reportType === type
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {customRange && (
              <div className="flex flex-col gap-4 mt-4 p-4 bg-slate-50 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600 font-medium px-1">Start Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600 font-medium px-1">Start Time</label>
                    <input
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600 font-medium px-1">End Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600 font-medium px-1">End Time</label>
                    <input
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateCustomReport}
                  disabled={!dateFrom || !dateTo}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  Generate Custom Report
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { icon: DollarSign, label: 'Revenue', value: `₨${summary.totalRevenue.toLocaleString()}`, sub: `${summary.totalOrders} orders`, gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-500' },
            { icon: TrendingUp, label: 'Profit', value: `₨${summary.totalProfit.toLocaleString()}`, sub: `${((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}% margin`, gradient: 'from-violet-500 to-purple-600', border: 'border-violet-500' },
            { icon: Package, label: 'Items Sold', value: summary.totalItems, sub: `${insights.totalUniqueItems} unique`, gradient: 'from-blue-500 to-cyan-600', border: 'border-blue-500' },
            { icon: Wallet, label: 'Avg Order', value: `₨${Math.round(summary.averageOrderValue)}`, sub: 'per transaction', gradient: 'from-amber-500 to-orange-600', border: 'border-amber-500' },
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all border-l-4 ${card.border}`}
            >
              <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl w-fit mb-3`}>
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mb-1">{card.label}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1">{card.value}</p>
              <p className="text-xs text-slate-500">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Daily Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`₨${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <LineChartIcon className="w-5 h-5 text-violet-500" />
              Order Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderTypeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} orders (₨${props.payload.revenue.toLocaleString()})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Order Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          {[
            { type: 'Dine-In', icon: Utensils, orders: summary.dineInOrders, revenue: summary.dineInRevenue, color: 'emerald' },
            { type: 'Takeaway', icon: ShoppingBag, orders: summary.takeawayOrders, revenue: summary.takeawayRevenue, color: 'blue' },
            { type: 'Delivery', icon: Truck, orders: summary.deliveryOrders, revenue: summary.deliveryRevenue, color: 'amber' },
          ].map((item, index) => (
            <div key={index} className={`bg-white rounded-2xl p-5 shadow-lg border-l-4 border-${item.color}-500`}>
              <div className="flex items-center gap-4 mb-3">
                <div className={`bg-${item.color}-100 p-3 rounded-xl`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{item.type} Orders</p>
                  <p className="text-2xl font-bold text-slate-800">{item.orders}</p>
                </div>
              </div>
              <div className={`bg-${item.color}-50 p-3 rounded-lg`}>
                <p className="text-xs text-slate-600 mb-1">Revenue</p>
                <p className={`text-lg font-bold text-${item.color}-600`}>
                  ₨{item.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ORDERS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <Receipt className="w-6 h-6 text-blue-600" />
                    Order Details
                  </h3>
                  <p className="text-sm text-slate-600">
                    {summary.completedOrders} completed • {summary.cancelledOrders} cancelled
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-600">Total Orders</span>
                    <p className="text-lg font-bold text-slate-800">{summary.totalOrders}</p>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-600">Success Rate</span>
                    <p className="text-lg font-bold text-emerald-600">
                      {((summary.completedOrders / summary.totalOrders) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by order #, customer, or phone..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  />
                </div>
                
             <select
  value={orderStatusFilter}
  onChange={(e) => setOrderStatusFilter(e.target.value)}
  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
>
  <option value="all">All Status</option>
  <option value="completed">Completed</option>
  <option value="pending">Pending</option>
  <option value="preparing">Preparing</option>
  <option value="ready">Ready</option>
  <option value="cancelled">Cancelled</option> {/* ADD THIS */}
</select>
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine-In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
                
                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                >
                  <option value="all">All Payments</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            {/* Orders List */}
            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={orderSearchTerm + orderStatusFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {filteredOrders.map((order, index) => {
                    const statusBadge = getStatusBadge(order.status);
                    const OrderTypeIcon = getOrderTypeIcon(order.orderType);
                    const PaymentIcon = getPaymentIcon(order.paymentMethod);
                    
                    return (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-gradient-to-r from-white to-slate-50 rounded-xl p-4 border-2 border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg flex-shrink-0">
                              <Receipt className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-bold text-slate-800 text-lg">
                                  #{order.orderNumber}
                                </h4>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                  <statusBadge.icon className="w-3 h-3" />
                                  {statusBadge.label}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{order.customerName}</span>
                                </div>
                                {order.phoneNumber && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span>{order.phoneNumber}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-600">
                                  <OrderTypeIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="capitalize">{order.orderType}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <span>
                                    {new Date(order.orderDate).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="px-3 py-1.5 bg-emerald-50 rounded-lg">
                                  <span className="text-xs text-emerald-600 font-medium">Total</span>
                                  <p className="text-sm font-bold text-emerald-700">₨{order.total.toLocaleString()}</p>
                                </div>
                                <div className="px-3 py-1.5 bg-violet-50 rounded-lg">
                                  <span className="text-xs text-violet-600 font-medium">Profit</span>
                                  <p className="text-sm font-bold text-violet-700">₨{order.totalProfit.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                                  <PaymentIcon className="w-4 h-4 text-slate-600" />
                                  <span className="text-sm font-medium text-slate-700 capitalize">{order.paymentMethod}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                                  <Package className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-700">{order.items.length} items</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-600 text-lg font-semibold">No orders found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your filters</p>
                </div>
              )}

         {orders && orders.length > ordersToShow && !showAllOrders && (
  <div className="text-center mt-6">
    <button
      onClick={() => setOrdersToShow(prev => prev + 50)}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
    >
      <ChevronDown className="w-5 h-5" />
      Load 50 More Orders ({Math.min(ordersToShow + 50, orders.length - ordersToShow)} remaining)
    </button>
  </div>
)}

{showAllOrders && (
  <div className="text-center mt-6">
    <button
      onClick={() => {
        setShowAllOrders(false);
        setOrdersToShow(50);
      }}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
    >
      <ChevronUp className="w-5 h-5" />
      Show Less
    </button>
  </div>
)}
            </div>
          </div>
        </motion.div>

        {/* ITEMS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <Trophy className="w-6 h-6 text-violet-600" />
                    Items Performance
                  </h3>
                  <p className="text-sm text-slate-600">
                    {popularItems.length} items tracked
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={itemSortBy}
                    onChange={(e) => setItemSortBy(e.target.value)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="quantity">Sort by Quantity</option>
                    <option value="revenue">Sort by Revenue</option>
                    <option value="profit">Sort by Profit</option>
                    <option value="margin">Sort by Margin</option>
                  </select>
                  
                  <button
                    onClick={() => setItemSortOrder(itemSortOrder === 'desc' ? 'asc' : 'desc')}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    {itemSortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={itemSearchTerm + itemSortBy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6"
                >
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 border-2 border-slate-100 hover:border-violet-300 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                      }`}>
                        #{index + 1}
                      </div>

                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 text-base mb-1 pr-8 group-hover:text-violet-600 transition-colors line-clamp-2">
                          {item.name}
                        </h4>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {item.category}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                          <span className="text-xs text-emerald-600 font-medium">Sold</span>
                          <span className="text-lg font-bold text-emerald-700">{item.totalQuantity}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <span className="text-xs text-blue-600 font-medium">Revenue</span>
                          <span className="text-sm font-bold text-blue-700">₨{item.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-violet-50 rounded-lg">
                          <span className="text-xs text-violet-600 font-medium">Profit</span>
                          <span className="text-sm font-bold text-violet-700">₨{item.totalProfit.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">Margin</span>
                          <span className="text-xs font-bold text-emerald-600">{item.profitMargin}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(parseFloat(item.profitMargin), 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-600">
                        <span>{item.orderCount} orders</span>
                        <span>₨{item.averagePrice.toFixed(0)} avg</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {popularItems.length > 8 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                  >
                    {showAllItems ? (
                      <>
                        <ChevronUp className="w-5 h-5" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5" />
                        Show All {popularItems.length} Items
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* TOP CUSTOMERS */}
        {topCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-600" />
                  Top Customers
                </h3>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCustomers.map((customer, index) => {
                  const tierBadge = getCustomerTierBadge(customer.totalSpent || 0);
                  const TierIcon = tierBadge.icon;
                  
                  return (
                    <div
                      key={customer._id}
                      className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border-2 border-slate-100 hover:border-amber-300 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${tierBadge.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{customer.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="w-3 h-3" />
                            <span>{customer.phoneNumber}</span>
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${tierBadge.color} text-white text-xs font-bold shadow-md`}>
                          <TierIcon className="w-3 h-3" />
                          {tierBadge.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xs text-blue-600">Orders</p>
                          <p className="text-lg font-bold text-blue-700">{customer.orderCount}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2">
                          <p className="text-xs text-emerald-600">Spent</p>
                          <p className="text-lg font-bold text-emerald-700">₨{(customer.totalSpent || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-600 text-sm">
          <p>
            Report: <span className="font-semibold">{reportType}</span>
            {reportType === 'Custom Range' && dateFrom && dateTo && (
              <span className="ml-1">
                ({new Date(dateFrom).toLocaleDateString()} {timeFrom} - {new Date(dateTo).toLocaleDateString()} {timeTo})
              </span>
            )}
            {' • '}
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Order Details</h2>
                      <p className="text-blue-100 text-sm">#{selectedOrder.orderNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-blue-100 text-xs mb-1">Total Amount</p>
                    <p className="text-xl font-bold">₨{selectedOrder.total.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-blue-100 text-xs mb-1">Profit</p>
                    <p className="text-xl font-bold">₨{selectedOrder.totalProfit.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-blue-100 text-xs mb-1">Items</p>
                    <p className="text-xl font-bold">{selectedOrder.items.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-blue-100 text-xs mb-1">Status</p>
                    <p className="text-xl font-bold capitalize">{selectedOrder.status}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                {/* Customer Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Name</p>
                      <p className="font-semibold text-slate-800">{selectedOrder.customerName}</p>
                    </div>
                    {selectedOrder.phoneNumber && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Phone</p>
                        <p className="font-semibold text-slate-800">{selectedOrder.phoneNumber}</p>
                      </div>
                    )}
                    {selectedOrder.address && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-600 mb-1">Address</p>
                        <p className="font-semibold text-slate-800">{selectedOrder.address}</p>
                      </div>
                    )}
                    {selectedOrder.tableNumber && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Table Number</p>
                        <p className="font-semibold text-slate-800">Table {selectedOrder.tableNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Order Type</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const TypeIcon = getOrderTypeIcon(selectedOrder.orderType);
                          return <TypeIcon className="w-4 h-4 text-blue-600" />;
                        })()}
                        <p className="font-semibold text-slate-800 capitalize">{selectedOrder.orderType}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Method</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const PayIcon = getPaymentIcon(selectedOrder.paymentMethod);
                          return <PayIcon className="w-4 h-4 text-blue-600" />;
                        })()}
                        <p className="font-semibold text-slate-800 capitalize">{selectedOrder.paymentMethod}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Order Date</p>
                      <p className="font-semibold text-slate-800">
                        {new Date(selectedOrder.orderDate).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Order Items
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-600">
                            ₨{item.price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">
                            ₨{(item.price * item.quantity).toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-600">
                            Profit: ₨{((item.price - item.costPrice) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Financial Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">₨{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedOrder.tax > 0 && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Tax</span>
                        <span className="font-semibold">₨{selectedOrder.tax.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex items-center justify-between text-red-600">
                        <span>Discount</span>
                        <span className="font-semibold">-₨{selectedOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryCharge > 0 && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Delivery Charge</span>
                        <span className="font-semibold">₨{selectedOrder.deliveryCharge.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-300 pt-2 mt-2">
                      <div className="flex items-center justify-between text-lg font-bold text-slate-800">
                        <span>Total</span>
                        <span>₨{selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-700 font-medium">Total Cost</span>
                        <span className="font-bold text-emerald-700">₨{selectedOrder.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-emerald-700 font-medium">Net Profit</span>
                        <span className="font-bold text-emerald-700">₨{selectedOrder.totalProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-emerald-600 text-sm">Profit Margin</span>
                        <span className="font-bold text-emerald-600">
                          {((selectedOrder.totalProfit / selectedOrder.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all font-semibold shadow-md"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}