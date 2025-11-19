'use client';

import { useState, useEffect } from 'react';
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
  TrendingDown,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
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
} from 'recharts';
import { getReportsData } from '@/lib/actions/reports';
import { getTopCustomers } from '@/lib/actions/customers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('This Week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customRange, setCustomRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('quantity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAllItems, setShowAllItems] = useState(false);

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
    } else if (reportType === 'This Week') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === 'This Month') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === 'Custom Range' && dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
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
      } else {
        setError(reportsResult.message || 'Failed to fetch reports data');
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

  const handleExportCSV = () => {
    if (!reportsData) return;

    const csvContent = [
      ['Item Name', 'Category', 'Quantity Sold', 'Total Revenue', 'Total Cost', 'Total Profit', 'Profit Margin %', 'Order Count', 'Avg Price'],
      ...reportsData.popularItems.map(item => [
        item.name,
        item.category,
        item.totalQuantity,
        item.totalRevenue.toFixed(2),
        item.totalCost.toFixed(2),
        item.totalProfit.toFixed(2),
        item.profitMargin,
        item.orderCount,
        item.averagePrice.toFixed(2),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      ['Total Cost', `₨${reportsData.summary.totalCost.toLocaleString()}`],
      ['Total Profit', `₨${reportsData.summary.totalProfit.toLocaleString()}`],
      ['Total Orders', reportsData.summary.totalOrders.toString()],
      ['Total Items Sold', reportsData.summary.totalItems.toString()],
      ['Unique Items', reportsData.insights.totalUniqueItems.toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.addPage();
    
    doc.setFontSize(14);
    doc.text('All Items Performance', 14, 20);

    const itemsData = reportsData.popularItems.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.totalQuantity.toString(),
      `₨${item.totalRevenue.toLocaleString()}`,
      `${item.profitMargin}%`,
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Rank', 'Item Name', 'Qty Sold', 'Revenue', 'Margin']],
      body: itemsData,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
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

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    if (!reportsData) return [];
    
    let items = [...reportsData.popularItems];
    
    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    items.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
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
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return showAllItems ? items : items.slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#10b981] animate-spin mx-auto mb-4" />
          <p className="text-[#64748b] text-lg">Loading reports data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-[#ef4444] text-lg font-semibold mb-2">Error</p>
          <p className="text-[#64748b] text-base mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (reportType === 'Custom Range') {
                handleGenerateCustomReport();
              } else {
                fetchReportsData();
              }
            }}
            className="px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#64748b] text-lg font-semibold mb-2">No Data Available</p>
          <p className="text-[#94a3b8] text-sm mb-4">
            {reportType === 'Custom Range' 
              ? 'Please select a date range and click Generate'
              : 'No orders found for the selected period'}
          </p>
        </div>
      </div>
    );
  }

  const { summary, chartData, transactions, popularItems, topItems, insights } = reportsData;
  const filteredItems = getFilteredAndSortedItems();

  const orderTypeChartData = [
    { name: 'Dine-In', value: summary.dineInOrders, revenue: summary.dineInRevenue },
    { name: 'Takeaway', value: summary.takeawayOrders, revenue: summary.takeawayRevenue },
    { name: 'Delivery', value: summary.deliveryOrders, revenue: summary.deliveryRevenue },
  ].filter(item => item.value > 0);

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1e293b] mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-[#10b981]" />
                Business Analytics Dashboard
              </h1>
              <p className="text-base text-[#64748b]">
                Comprehensive insights • {insights.totalUniqueItems} unique items • {summary.totalItems} units sold
              </p>
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <button
                onClick={handleExportCSV}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-[#10b981] text-[#10b981] rounded-lg hover:bg-[#10b981] hover:text-white transition-all font-medium shadow-sm"
              >
                <FileText className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-5 h-5 text-[#10b981]" />
              <span className="font-semibold text-[#1e293b]">Report Period:</span>
              <div className="flex flex-wrap gap-2">
                {['Today', 'This Week', 'This Month', 'Custom Range'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      setCustomRange(type === 'Custom Range');
                      setError(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      reportType === type
                        ? 'bg-[#10b981] text-white shadow-md'
                        : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {customRange && (
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b]"
                />
                <span className="text-[#64748b] text-center sm:text-left">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b]"
                />
                <button
                  onClick={handleGenerateCustomReport}
                  disabled={!dateFrom || !dateTo}
                  className="px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border-l-4 border-[#10b981]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-[#10b981] to-[#059669] p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-[#1e293b]">
                ₨{summary.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {summary.totalOrders} orders • Avg ₨{Math.round(summary.averageOrderValue)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border-l-4 border-[#8b5cf6]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-sm mb-1">Total Profit</p>
              <p className="text-3xl font-bold text-[#1e293b]">
                ₨{summary.totalProfit.toLocaleString()}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}% profit margin
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border-l-4 border-[#3b82f6]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-3 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-sm mb-1">Items Sold</p>
              <p className="text-3xl font-bold text-[#1e293b]">
                {summary.totalItems}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {insights.totalUniqueItems} unique items
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border-l-4 border-[#f59e0b]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-sm mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-[#1e293b]">
                ₨{summary.totalCost.toLocaleString()}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                Cost of goods sold
              </p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-[#1e293b] flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[#10b981]" />
              Daily Sales Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`₨${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-[#1e293b] flex items-center gap-2 mb-6">
              <LineChartIcon className="w-5 h-5 text-[#8b5cf6]" />
              Order Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderTypeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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

        {/* Order Type Breakdown Cards */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.75 }}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
>
  {/* Dine-In Card */}
  <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#10b981]">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-[#10b981]/10 p-3 rounded-xl">
        <Utensils className="w-6 h-6 text-[#10b981]" />
      </div>
      <div>
        <p className="text-[#64748b] text-sm">Dine-In Orders</p>
        <p className="text-2xl font-bold text-[#1e293b]">{summary.dineInOrders}</p>
      </div>
    </div>
    <div className="bg-[#f8fafc] p-3 rounded-lg">
      <p className="text-xs text-[#64748b] mb-1">Revenue</p>
      <p className="text-lg font-bold text-[#10b981]">
        ₨{summary.dineInRevenue.toLocaleString()}
      </p>
    </div>
  </div>

  {/* Takeaway Card */}
  <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#3b82f6]">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-[#3b82f6]/10 p-3 rounded-xl">
        <ShoppingBag className="w-6 h-6 text-[#3b82f6]" />
      </div>
      <div>
        <p className="text-[#64748b] text-sm">Takeaway Orders</p>
        <p className="text-2xl font-bold text-[#1e293b]">{summary.takeawayOrders}</p>
      </div>
    </div>
    <div className="bg-[#f8fafc] p-3 rounded-lg">
      <p className="text-xs text-[#64748b] mb-1">Revenue</p>
      <p className="text-lg font-bold text-[#3b82f6]">
        ₨{summary.takeawayRevenue.toLocaleString()}
      </p>
    </div>
  </div>

  {/* Delivery Card */}
  <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#f59e0b] sm:col-span-2 lg:col-span-1">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-[#f59e0b]/10 p-3 rounded-xl">
        <Truck className="w-6 h-6 text-[#f59e0b]" />
      </div>
      <div>
        <p className="text-[#64748b] text-sm">Delivery Orders</p>
        <p className="text-2xl font-bold text-[#1e293b]">{summary.deliveryOrders}</p>
      </div>
    </div>
    <div className="bg-[#f8fafc] p-3 rounded-lg">
      <p className="text-xs text-[#64748b] mb-1">Revenue</p>
      <p className="text-lg font-bold text-[#f59e0b]">
        ₨{summary.deliveryRevenue.toLocaleString()}
      </p>
    </div>
  </div>
</motion.div>

        {/* ALL ITEMS SECTION - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2e8f0] bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#1e293b] flex items-center gap-2 mb-2">
                    <Trophy className="w-6 h-6 text-[#8b5cf6]" />
                    Complete Items Performance Analysis
                  </h3>
                  <p className="text-sm text-[#64748b]">
                    All items with more than 1 unit sold • Total: {popularItems.length} items
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-white rounded-lg border border-[#e2e8f0]">
                    <span className="text-xs text-[#64748b]">Total Items</span>
                    <p className="text-lg font-bold text-[#1e293b]">{popularItems.length}</p>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-lg border border-[#e2e8f0]">
                    <span className="text-xs text-[#64748b]">Units Sold</span>
                    <p className="text-lg font-bold text-[#10b981]">{summary.totalItems}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="p-6 bg-[#f8fafc] border-b border-[#e2e8f0]">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search items by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all"
                  >
                    <option value="quantity">Sort by Quantity</option>
                    <option value="revenue">Sort by Revenue</option>
                    <option value="profit">Sort by Profit</option>
                    <option value="margin">Sort by Margin</option>
                    <option value="name">Sort by Name</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-all"
                  >
                    {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={searchTerm + sortBy + sortOrder}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6"
                >
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                      {/* Rank Badge */}
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                      }`}>
                        #{index + 1}
                      </div>

                      {/* Item Info */}
                      <div className="mb-4">
                        <h4 className="font-bold text-[#1e293b] text-base mb-1 pr-8 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {item.name}
                        </h4>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {item.category}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                          <span className="text-xs text-emerald-600 font-medium">Quantity Sold</span>
                          <span className="text-lg font-bold text-emerald-700">{item.totalQuantity}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <span className="text-xs text-blue-600 font-medium">Revenue</span>
                          <span className="text-sm font-bold text-blue-700">₨{item.totalRevenue.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <span className="text-xs text-purple-600 font-medium">Profit</span>
                          <span className="text-sm font-bold text-purple-700">₨{item.totalProfit.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#64748b]">Profit Margin</span>
                          <span className="text-xs font-bold text-[#10b981]">{item.profitMargin}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(parseFloat(item.profitMargin), 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="text-xs text-[#64748b]">
                          <span className="font-medium">Orders:</span> {item.orderCount}
                        </div>
                        <div className="text-xs text-[#64748b]">
                          <span className="font-medium">Avg Price:</span> ₨{item.averagePrice.toFixed(0)}
                        </div>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all pointer-events-none rounded-xl" />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Show More/Less Button */}
              {popularItems.length > 10 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
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

              {/* No Results Message */}
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-[#64748b] text-lg font-semibold">No items found</p>
                  <p className="text-[#94a3b8] text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-[#e2e8f0]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-[#64748b] mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-[#1e293b]">{popularItems.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#64748b] mb-1">Units Sold</p>
                  <p className="text-2xl font-bold text-[#10b981]">{summary.totalItems}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#64748b] mb-1">Total Revenue</p>
                  <p className="md:text-2xl text-xs font-bold text-[#3b82f6]">₨{summary.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#64748b] mb-1">Total Profit</p>
                  <p className="md:text-2xl text-xs font-bold text-[#8b5cf6]">₨{summary.totalProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TOP CUSTOMERS SECTION */}
        {topCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-8"
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#e2e8f0] bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
                      <Users className="w-6 h-6 text-[#8b5cf6]" />
                      Top Loyal Customers
                    </h3>
                    <p className="text-sm text-[#64748b] mt-1">
                      Most valued customers ranked by spending & orders
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg backdrop-blur-sm">
                    <Trophy className="w-5 h-5 text-[#f59e0b]" />
                    <span className="text-sm font-bold text-[#1e293b]">{topCustomers.length} VIPs</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topCustomers.map((customer, index) => {
                    const tierBadge = getCustomerTierBadge(customer.totalSpent || 0);
                    const TierIcon = tierBadge.icon;
                    
                    return (
                      <motion.div
                        key={customer._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                        <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                            : index === 2
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                            : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-14 h-14 bg-gradient-to-br ${tierBadge.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1e293b] text-sm mb-1 truncate group-hover:text-purple-600 transition-colors">
                              {customer.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-[#64748b] mb-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{customer.phoneNumber}</span>
                            </div>
                            {customer.address && (
                              <div className="flex items-start gap-1.5 text-xs text-[#94a3b8]">
                                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{customer.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${tierBadge.color} text-white text-xs font-bold mb-3 shadow-md`}>
                          <TierIcon className="w-3 h-3" />
                          {tierBadge.label}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 rounded-lg p-2.5">
                            <p className="text-xs text-blue-600 mb-0.5 flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3" />
                              Orders
                            </p>
                            <p className="text-lg font-bold text-blue-700">{customer.orderCount}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-2.5">
                            <p className="text-xs text-emerald-600 mb-0.5 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Spent
                            </p>
                            <p className="text-lg font-bold text-emerald-700">
                              ₨{(customer.totalSpent || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {customer.lastOrderDate && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#94a3b8]">Last order:</span>
                              <span className="text-[#64748b] font-medium">
                                {new Date(customer.lastOrderDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all pointer-events-none rounded-xl" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Key Insights Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-emerald-100 text-sm">Best Selling Item</p>
                <p className="text-2xl font-bold truncate">{insights.bestItem.name}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-sm text-emerald-100">Total Sold</p>
              <p className="text-3xl font-bold">{insights.bestItem.totalQuantity} units</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Peak Hours</p>
                <p className="text-2xl font-bold">{insights.peakHour}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-sm text-blue-100">Most Active Time</p>
              <p className="text-3xl font-bold">Busiest Period</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <p className="text-purple-100 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold">₨{insights.avgOrderValue}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-sm text-purple-100">Per Transaction</p>
              <p className="text-3xl font-bold">
                ₨{summary.totalOrders > 0 ? Math.round(summary.totalProfit / summary.totalOrders) : 0} Profit
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center text-[#64748b] text-sm"
        >
          <p>
            Report generated for <span className="font-semibold text-[#1e293b]">{reportType}</span>
            {' • '}
            Last updated: {new Date().toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </motion.div>
      </div>
    </div>
  );
}