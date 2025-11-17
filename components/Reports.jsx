'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    // Prevent zoom on mobile inputs
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

  // Fetch data on mount and when reportType changes (except for Custom Range)
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

      // Fetch both reports and customers in parallel
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
      ['Order ID', 'Date', 'Time', 'Revenue', 'Cost', 'Profit', 'Payment Method', 'Order Type'],
      ...reportsData.transactions.map(t => [
        t.id,
        t.date,
        t.time,
        t.revenue,
        t.cost,
        t.profit,
        t.paymentMethod,
        t.orderType,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!reportsData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Restaurant Business Report', pageWidth / 2, 20, { align: 'center' });
    
    // Report period
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Period: ${reportType}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });

    // Summary Statistics
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Summary Statistics', 14, 45);
    
    const summaryData = [
      ['Total Revenue', `₨${reportsData.summary.totalRevenue.toLocaleString()}`],
      ['Total Cost', `₨${reportsData.summary.totalCost.toLocaleString()}`],
      ['Total Profit', `₨${reportsData.summary.totalProfit.toLocaleString()}`],
      ['Total Orders', reportsData.summary.totalOrders.toString()],
      ['Average Order Value', `₨${Math.round(reportsData.summary.averageOrderValue).toLocaleString()}`],
      ['Profit Margin', `${((reportsData.summary.totalProfit / reportsData.summary.totalRevenue) * 100).toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Order Type Breakdown
    let finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text('Order Type Breakdown', 14, finalY + 10);

    const orderTypeData = [
      ['Dine-In', reportsData.summary.dineInOrders.toString(), `₨${reportsData.summary.dineInRevenue.toLocaleString()}`],
      ['Takeaway', reportsData.summary.takeawayOrders.toString(), `₨${reportsData.summary.takeawayRevenue.toLocaleString()}`],
      ['Delivery', reportsData.summary.deliveryOrders.toString(), `₨${reportsData.summary.deliveryRevenue.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: finalY + 15,
      head: [['Order Type', 'Count', 'Revenue']],
      body: orderTypeData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Add new page for more details
    doc.addPage();
    
    // Top Customers
    if (topCustomers.length > 0) {
      doc.setFontSize(14);
      doc.text('Top Customers', 14, 20);

      const customersData = topCustomers.map((customer, index) => [
        (index + 1).toString(),
        customer.name,
        customer.phoneNumber,
        customer.orderCount.toString(),
        `₨${(customer.totalSpent || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 25,
        head: [['Rank', 'Name', 'Phone', 'Orders', 'Total Spent']],
        body: customersData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      });

      finalY = doc.lastAutoTable.finalY || 25;
    }

    // Top Selling Items
    doc.setFontSize(14);
    doc.text('Top Selling Items', 14, topCustomers.length > 0 ? finalY + 10 : 20);

    const topItemsData = reportsData.popularItems.slice(0, 10).map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.sold.toString(),
    ]);

    autoTable(doc, {
      startY: topCustomers.length > 0 ? finalY + 15 : 25,
      head: [['Rank', 'Item Name', 'Units Sold']],
      body: topItemsData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
    });

    // Save PDF
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#10b981] animate-spin mx-auto mb-4" />
          <p className="text-[#64748b] text-base sm:text-lg">Loading reports data...</p>
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
          {reportType === 'Custom Range' && (
            <button
              onClick={() => setCustomRange(true)}
              className="px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium"
            >
              Select Date Range
            </button>
          )}
        </div>
      </div>
    );
  }

  const { summary, chartData, transactions, popularItems, insights } = reportsData;

  // Calculate order type percentages
  const orderTypeChartData = [
    { name: 'Dine-In', value: summary.dineInOrders, revenue: summary.dineInRevenue },
    { name: 'Takeaway', value: summary.takeawayOrders, revenue: summary.takeawayRevenue },
    { name: 'Delivery', value: summary.deliveryOrders, revenue: summary.deliveryRevenue },
  ].filter(item => item.value > 0);

  return (
    <div className="w-[94vw] md:w-[100%] mx-auto bg-[#f5f7fa] p-4 sm:p-6 lg:p-8">
      <div className="md:max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-2 flex items-center gap-2 sm:gap-3">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#10b981] flex-shrink-0" />
                <span className="leading-tight">Business Reports & Analytics</span>
              </h1>
              <p className="text-sm sm:text-base text-[#64748b]">
                Comprehensive insights into your restaurant's performance
              </p>
            </div>
            
            {/* Export Buttons */}
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white border-2 border-[#10b981] text-[#10b981] rounded-lg hover:bg-[#10b981] hover:text-white transition-all font-medium shadow-sm text-sm"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Export</span> CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md text-sm"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Export</span> PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981] flex-shrink-0" />
              <span className="font-semibold text-[#1e293b] text-sm sm:text-base">Report Period:</span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {['Today', 'This Week', 'This Month', 'Custom Range'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      setCustomRange(type === 'Custom Range');
                      setError(null);
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
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
                  className="px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-sm"
                />
                <span className="text-[#64748b] text-center sm:text-left text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-sm"
                />
                <button
                  onClick={handleGenerateCustomReport}
                  disabled={!dateFrom || !dateTo}
                  className="px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Revenue Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-[#10b981] group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-[#10b981] to-[#059669] p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-xs sm:text-sm mb-1">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1e293b]">
                ₨{summary.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                From {summary.totalOrders} orders
              </p>
            </div>
          </motion.div>

          {/* Total Profit Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-[#8b5cf6] group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-xs sm:text-sm mb-1">Total Profit</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1e293b]">
                ₨{summary.totalProfit.toLocaleString()}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}% margin
              </p>
            </div>
          </motion.div>

          {/* Total Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-[#3b82f6] group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-xs sm:text-sm mb-1">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1e293b]">
                {summary.totalOrders}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                Completed successfully
              </p>
            </div>
          </motion.div>

          {/* Total Expenses Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-[#f59e0b] group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-xs sm:text-sm mb-1">Total Expenses</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1e293b]">
                ₨{summary.totalCost.toLocaleString()}
              </p>
              <p className="text-xs text-[#94a3b8] mt-2">
                Cost of goods sold
              </p>
            </div>
          </motion.div>
        </div>

        {/* Order Type Breakdown Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {/* Dine-In */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-l-4 border-[#10b981]">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-[#10b981]/10 p-2 sm:p-3 rounded-xl">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-[#10b981]" />
              </div>
              <div>
                <p className="text-[#64748b] text-xs sm:text-sm">Dine-In Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1e293b]">{summary.dineInOrders}</p>
              </div>
            </div>
            <div className="bg-[#f8fafc] p-3 rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Revenue</p>
              <p className="text-base sm:text-lg font-bold text-[#10b981]">
                ₨{summary.dineInRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Takeaway */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-l-4 border-[#3b82f6]">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-[#3b82f6]/10 p-2 sm:p-3 rounded-xl">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-[#64748b] text-xs sm:text-sm">Takeaway Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1e293b]">{summary.takeawayOrders}</p>
              </div>
            </div>
            <div className="bg-[#f8fafc] p-3 rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Revenue</p>
              <p className="text-base sm:text-lg font-bold text-[#3b82f6]">
                ₨{summary.takeawayRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-l-4 border-[#f59e0b] sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-[#f59e0b]/10 p-2 sm:p-3 rounded-xl">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-[#64748b] text-xs sm:text-sm">Delivery Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1e293b]">{summary.deliveryOrders}</p>
              </div>
            </div>
            <div className="bg-[#f8fafc] p-3 rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Revenue</p>
              <p className="text-base sm:text-lg font-bold text-[#f59e0b]">
                ₨{summary.deliveryRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Sales Overview Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1e293b] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981]" />
                  Sales Overview
                </h3>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1">Daily revenue breakdown</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`₨${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Order Type Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1e293b] flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b5cf6]" />
                  Order Type Distribution
                </h3>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1">Breakdown by order type</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderTypeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '11px' }}
                >
                  {orderTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value, name, props) => [
                    `${value} orders (₨${props.payload.revenue.toLocaleString()})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* TOP CUSTOMERS SECTION - NEW */}
        {topCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-6 sm:mb-8"
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[#e2e8f0] bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#1e293b] flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b5cf6]" />
                      Top Loyal Customers
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                      Most valued customers ranked by spending & orders
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg backdrop-blur-sm">
                    <Trophy className="w-5 h-5 text-[#f59e0b]" />
                    <span className="text-sm font-bold text-[#1e293b]">{topCustomers.length} VIPs</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
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
                        {/* Rank Badge */}
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

                        {/* Customer Avatar & Info */}
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

                        {/* Tier Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${tierBadge.color} text-white text-xs font-bold mb-3 shadow-md`}>
                          <TierIcon className="w-3 h-3" />
                          {tierBadge.label}
                        </div>

                        {/* Stats Grid */}
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

                        {/* Last Order Date */}
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

                        {/* Hover Effect Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all pointer-events-none rounded-xl" />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Customer Stats Summary */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Total Customers</p>
                        <p className="text-xl font-bold text-purple-700">{topCustomers.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Total Orders</p>
                        <p className="text-xl font-bold text-blue-700">
                          {topCustomers.reduce((sum, c) => sum + c.orderCount, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 sm:col-span-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 p-2 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">Total Revenue</p>
                        <p className="text-xl font-bold text-emerald-700">
                          ₨{topCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Detailed Report Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 sm:mb-8"
        >
          <div className="p-4 sm:p-6 border-b border-[#e2e8f0]">
            <h3 className="text-base sm:text-lg font-bold text-[#1e293b]">Detailed Transactions</h3>
            <p className="text-xs sm:text-sm text-[#64748b] mt-1">
              Complete breakdown of all orders
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Order ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Date & Time
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Revenue
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569] hidden sm:table-cell">
                    Cost
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Profit
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569] hidden md:table-cell">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-[#1e293b] text-xs sm:text-sm">
                      {transaction.id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-[#64748b] text-xs sm:text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.date}</span>
                        <span className="text-xs text-[#94a3b8]">{transaction.time}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        transaction.orderType === 'dine-in'
                          ? 'bg-[#10b981]/10 text-[#10b981]'
                          : transaction.orderType === 'takeaway'
                          ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                          : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                      }`}>
                        {transaction.orderType === 'dine-in' ? '🍽️' : 
                         transaction.orderType === 'takeaway' ? '🛍️' : 
                         '🚚'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-[#1e293b] text-xs sm:text-sm">
                      ₨{transaction.revenue.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-[#ef4444] text-xs sm:text-sm hidden sm:table-cell">
                      ₨{transaction.cost.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`font-bold text-xs sm:text-sm ${
                        transaction.profit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}>
                        ₨{transaction.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <span className="px-2 sm:px-3 py-1 bg-[#f1f5f9] text-[#475569] rounded-lg text-xs font-medium">
                        {transaction.paymentMethod}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Additional Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <h3 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#10b981]" />
            Additional Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Best Selling Item */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl p-4 sm:p-6 shadow-lg text-white hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#d1fae5] text-xs sm:text-sm">Best Selling Item</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{insights.bestItem.name}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs sm:text-sm text-[#d1fae5]">Total Sold</p>
                <p className="text-2xl sm:text-3xl font-bold">{insights.bestItem.sold} units</p>
              </div>
            </motion.div>

            {/* Peak Hours */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
              className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-xl p-4 sm:p-6 shadow-lg text-white hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <p className="text-[#dbeafe] text-xs sm:text-sm">Peak Hours</p>
                  <p className="text-lg sm:text-2xl font-bold">{insights.peakHour}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs sm:text-sm text-[#dbeafe]">Most Active Time</p>
                <p className="text-2xl sm:text-3xl font-bold">Busiest Period</p>
              </div>
            </motion.div>

            {/* Average Order Value */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4 }}
              className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-xl p-4 sm:p-6 shadow-lg text-white hover:scale-105 transition-transform cursor-pointer md:col-span-3 lg:col-span-1"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <p className="text-[#ede9fe] text-xs sm:text-sm">Avg Order Value</p>
                  <p className="text-lg sm:text-2xl font-bold">₨{insights.avgOrderValue}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs sm:text-sm text-[#ede9fe]">Per Transaction</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  ₨{summary.totalOrders > 0 ? Math.round(summary.totalProfit / summary.totalOrders) : 0} Profit
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Performance Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          {/* Profit Margin Card */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-l-4 border-[#10b981]">
            <h4 className="text-base sm:text-lg font-bold text-[#1e293b] mb-4">Profit Margin Analysis</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#64748b] text-xs sm:text-sm">Gross Profit Margin:</span>
                <span className="font-bold text-[#10b981] text-base sm:text-lg">
                  {((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((summary.totalProfit / summary.totalRevenue) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div className="bg-[#f8fafc] p-3 rounded-lg">
                  <p className="text-xs text-[#64748b] mb-1">Revenue</p>
                  <p className="font-bold text-[#1e293b] text-sm">₨{summary.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-[#f8fafc] p-3 rounded-lg">
                  <p className="text-xs text-[#64748b] mb-1">Profit</p>
                  <p className="font-bold text-[#10b981] text-sm">₨{summary.totalProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-l-4 border-[#3b82f6]">
            <h4 className="text-base sm:text-lg font-bold text-[#1e293b] mb-4">Payment Methods</h4>
            <div className="space-y-4">
              {(() => {
                const cashOrders = transactions.filter(t => t.paymentMethod === 'Cash').length;
                const cardOrders = transactions.filter(t => t.paymentMethod === 'Card').length;
                const onlineOrders = transactions.filter(t => t.paymentMethod === 'Online').length;
                const total = transactions.length;
                const cashPercentage = total > 0 ? (cashOrders / total) * 100 : 0;
                const cardPercentage = total > 0 ? (cardOrders / total) * 100 : 0;
                const onlinePercentage = total > 0 ? (onlineOrders / total) * 100 : 0;

                return (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#64748b] flex items-center gap-2 text-xs sm:text-sm">
                          💵 Cash
                        </span>
                        <span className="font-bold text-[#1e293b] text-xs sm:text-sm">
                          {cashOrders} orders ({cashPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${cashPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#64748b] flex items-center gap-2 text-xs sm:text-sm">
                          💳 Card
                        </span>
                        <span className="font-bold text-[#1e293b] text-xs sm:text-sm">
                          {cardOrders} orders ({cardPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] h-full rounded-full transition-all duration-1000"
                          style={{ width: `${cardPercentage}%` }}
                        />
                      </div>
                    </div>
                    {onlineOrders > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#64748b] flex items-center gap-2 text-xs sm:text-sm">
                            🌐 Online
                          </span>
                          <span className="font-bold text-[#1e293b] text-xs sm:text-sm">
                            {onlineOrders} orders ({onlinePercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] h-full rounded-full transition-all duration-1000"
                            style={{ width: `${onlinePercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* Top Selling Items Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-[#e2e8f0]">
            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981]" />
              Top Selling Menu Items
            </h3>
            <p className="text-xs sm:text-sm text-[#64748b] mt-1">
              Most popular items in the selected period
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Rank
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Item Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569]">
                    Units Sold
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#475569] hidden sm:table-cell">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {popularItems.map((item, index) => (
                  <tr
                    key={item.name}
                    className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-[#94a3b8] to-[#64748b] text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-white'
                          : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-[#1e293b] text-xs sm:text-sm">
                      {item.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="text-base sm:text-lg font-bold text-[#10b981]">
                        {item.sold}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#f1f5f9] rounded-full h-2 overflow-hidden max-w-[150px]">
                          <div 
                            className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full rounded-full"
                            style={{ width: `${popularItems.length > 0 ? (item.sold / popularItems[0].sold) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-[#64748b]">
                          {popularItems.length > 0 ? ((item.sold / popularItems[0].sold) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="mt-6 sm:mt-8 text-center text-[#64748b] text-xs sm:text-sm"
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


// i have this reposts page i want to make it more professional and optimized so i want to show all items in top sellings items how i know which items is how much quantity of that item sold not top 10 show every item which have more than 1 quantity sold and make this reports page professional and give me full final production ready code no mock data use serveractions as i have used