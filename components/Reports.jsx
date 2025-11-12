// app/reports/page.jsx
'use client';

import { useState, useMemo, useEffect } from 'react';
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
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LineChart as LineChartIcon,
  FileText,
  Utensils,
  ShoppingBag,
  Truck,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const filters = {};
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (reportType === 'Today') {
        filters.startDate = today.toISOString();
        filters.endDate = today.toISOString();
      } else if (reportType === 'This Week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.startDate = weekAgo.toISOString();
        filters.endDate = today.toISOString();
      } else if (reportType === 'This Month') {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        filters.startDate = monthAgo.toISOString();
        filters.endDate = today.toISOString();
      } else if (reportType === 'Custom Range' && dateFrom && dateTo) {
        filters.startDate = dateFrom;
        filters.endDate = dateTo;
      }

      const result = await getReportsData(filters);
      if (result.success) {
        setReportsData(result.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomReport = () => {
    if (dateFrom && dateTo) {
      setReportType('Custom Range');
      fetchReportsData();
    }
  };

  // Export to CSV
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
  };

  // Export to PDF with charts
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

    // Payment Methods
    finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text('Payment Methods', 14, finalY + 10);

    const cashOrders = reportsData.transactions.filter(t => t.paymentMethod === 'Cash').length;
    const cardOrders = reportsData.transactions.filter(t => t.paymentMethod === 'Card').length;
    const onlineOrders = reportsData.transactions.filter(t => t.paymentMethod === 'Online').length;

    const paymentData = [
      ['Cash', cashOrders.toString(), `₨${reportsData.summary.cashPayments.toLocaleString()}`],
      ['Card', cardOrders.toString(), `₨${reportsData.summary.cardPayments.toLocaleString()}`],
      ['Online', onlineOrders.toString(), `₨${reportsData.summary.onlinePayments.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: finalY + 15,
      head: [['Payment Method', 'Count', 'Amount']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
    });

    // Add new page for transactions
    doc.addPage();
    
    // Top Selling Items
    doc.setFontSize(14);
    doc.text('Top Selling Items', 14, 20);

    const topItemsData = reportsData.popularItems.slice(0, 10).map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.sold.toString(),
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Rank', 'Item Name', 'Units Sold']],
      body: topItemsData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
    });

    // Detailed Transactions
    finalY = doc.lastAutoTable.finalY || 25;
    doc.setFontSize(14);
    doc.text('Recent Transactions', 14, finalY + 10);

    const transactionData = reportsData.transactions.slice(0, 20).map(t => [
      t.id,
      t.date,
      t.time,
      `₨${t.revenue.toLocaleString()}`,
      `₨${t.profit.toLocaleString()}`,
      t.paymentMethod,
    ]);

    autoTable(doc, {
      startY: finalY + 15,
      head: [['Order ID', 'Date', 'Time', 'Revenue', 'Profit', 'Payment']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 },
    });

    // Save PDF
    doc.save(`restaurant-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#64748b] text-base sm:text-lg">No data available</p>
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
    <div className="min-h-screen bg-[#f5f7fa] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
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
                      if (type !== 'Custom Range') {
                        fetchReportsData();
                      }
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
                  className="px-6 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md text-sm"
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
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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

        {/* Detailed Report Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
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
          transition={{ delay: 1.0 }}
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
              transition={{ delay: 1.1 }}
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
              transition={{ delay: 1.2 }}
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
              transition={{ delay: 1.3 }}
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
          transition={{ delay: 1.4 }}
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
          transition={{ delay: 1.5 }}
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
          transition={{ delay: 1.6 }}
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