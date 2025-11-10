// app/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Calendar,
  Users,
  Package,
  Utensils,
  TrendingDown,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { getSalesForRange } from '@/lib/actions/orders';
import { getPopularItems } from '@/lib/actions/orders';
import { getActiveMenuItems } from '@/lib/actions/menuItems';

// Status colors configuration
const statusConfig = {
  completed: {
    bg: 'bg-[#d1fae5]',
    text: 'text-[#059669]',
    icon: CheckCircle,
  },
  preparing: {
    bg: 'bg-[#dbeafe]',
    text: 'text-[#2563eb]',
    icon: Clock,
  },
  pending: {
    bg: 'bg-[#fef3c7]',
    text: 'text-[#d97706]',
    icon: Clock,
  },
  cancelled: {
    bg: 'bg-[#fee2e2]',
    text: 'text-[#dc2626]',
    icon: XCircle,
  },
};

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;

    const totalMilSecDur = parseInt(duration);
    const incrementTime = (totalMilSecDur / end) * 1000;

    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMilSecDur / 16.67));
      if(start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16.67);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    todayOrders: 0,
    todayProfit: 0,
    todayCost: 0,
    totalMenuItems: 0,
    activeMenuItems: 0,
    popularItems: [],
    weekSales: [],
  });

  // Fetch real data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Calculate date range for last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

        // Fetch last 7 days sales data
        const salesRangeResult = await getSalesForRange(
          startDate.toISOString(),
          endDate.toISOString()
        );

        let weekSalesData = [];
        let todayStats = {
          totalSales: 0,
          totalOrders: 0,
          totalProfit: 0,
          totalCost: 0,
        };

        if (salesRangeResult.success && salesRangeResult.data) {
          // Process the aggregated data
          const salesMap = {};
          salesRangeResult.data.forEach(day => {
            salesMap[day._id] = {
              revenue: day.revenue || 0,
              orders: day.orders || 0,
              profit: day.profit || 0,
              cost: day.cost || 0,
            };
          });

          // Generate all 7 days with data or zeros
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          weekSalesData = [];
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay()];
            
            const dayData = salesMap[dateStr] || { revenue: 0, orders: 0, profit: 0, cost: 0 };
            
            weekSalesData.push({
              date: dayName,
              sales: dayData.revenue,
              orders: dayData.orders,
              profit: dayData.profit,
            });

            // If this is today, save the stats
            if (i === 0) {
              todayStats = {
                totalSales: dayData.revenue,
                totalOrders: dayData.orders,
                totalProfit: dayData.profit,
                totalCost: dayData.cost,
              };
            }
          }
        }

        // Fetch popular items
        const popularResult = await getPopularItems(5);
        const popularItems = popularResult.success ? popularResult.data : [];

        // Fetch menu items for stats
        const menuResult = await getActiveMenuItems();
        const menuItems = menuResult.success ? menuResult.data : [];

        setDashboardData({
          todaySales: todayStats.totalSales || 0,
          todayOrders: todayStats.totalOrders || 0,
          todayProfit: todayStats.totalProfit || 0,
          todayCost: todayStats.totalCost || 0,
          totalMenuItems: menuItems.length,
          activeMenuItems: menuItems.filter(item => item.isActive).length,
          popularItems: popularItems,
          weekSales: weekSalesData,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Calculate percentage changes (mock for now - you can enhance with historical data)
  const percentageChanges = {
    sales: 12.5,
    orders: 8.3,
    profit: 15.2,
    items: 5.0,
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b] text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1e293b] mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            Dashboard Overview
          </h1>
          <p className="text-[#64748b] text-lg">
            Welcome back! Here's what's happening with your restaurant today.
          </p>
        </motion.div>

        {/* Top Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Today's Sales Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-[#e2e8f0] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10b981]/10 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-[#10b981] to-[#059669] p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  percentageChanges.sales >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>
                  {percentageChanges.sales >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(percentageChanges.sales)}%
                </div>
              </div>
              <div>
                <p className="text-[#64748b] text-sm mb-1 font-medium">Today's Sales</p>
                <p className="text-3xl font-bold text-[#1e293b]">
                  <AnimatedCounter value={dashboardData.todaySales} prefix="₨" />
                </p>
                <p className="text-xs text-[#94a3b8] mt-2">
                  {dashboardData.todayOrders} orders today
                </p>
              </div>
            </div>
          </motion.div>

          {/* Today's Orders Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-[#e2e8f0] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3b82f6]/10 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  percentageChanges.orders >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>
                  {percentageChanges.orders >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(percentageChanges.orders)}%
                </div>
              </div>
              <div>
                <p className="text-[#64748b] text-sm mb-1 font-medium">Today's Orders</p>
                <p className="text-3xl font-bold text-[#1e293b]">
                  <AnimatedCounter value={dashboardData.todayOrders} />
                </p>
                <p className="text-xs text-[#94a3b8] mt-2">
                  Completed successfully
                </p>
              </div>
            </div>
          </motion.div>

          {/* Today's Profit Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-[#e2e8f0] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8b5cf6]/10 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  percentageChanges.profit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>
                  {percentageChanges.profit >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(percentageChanges.profit)}%
                </div>
              </div>
              <div>
                <p className="text-[#64748b] text-sm mb-1 font-medium">Today's Profit</p>
                <p className="text-3xl font-bold text-[#1e293b]">
                  <AnimatedCounter value={dashboardData.todayProfit} prefix="₨" />
                </p>
                <p className="text-xs text-[#94a3b8] mt-2">
                  {dashboardData.todaySales > 0 
                    ? ((dashboardData.todayProfit / dashboardData.todaySales) * 100).toFixed(1)
                    : 0}% profit margin
                </p>
              </div>
            </div>
          </motion.div>

          {/* Menu Items Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-[#e2e8f0] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f59e0b]/10 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[#10b981] text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </div>
              </div>
              <div>
                <p className="text-[#64748b] text-sm mb-1 font-medium">Menu Items</p>
                <p className="text-3xl font-bold text-[#1e293b]">
                  <AnimatedCounter value={dashboardData.activeMenuItems} />
                </p>
                <p className="text-xs text-[#94a3b8] mt-2">
                  {dashboardData.totalMenuItems} total items
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Charts and Popular Items Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart - Takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-[#e2e8f0]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#10b981]" />
                  Sales Overview
                </h2>
                <p className="text-sm text-[#64748b] mt-1">Last 7 days performance</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10b981]/10 to-[#059669]/10 rounded-lg">
                <Calendar className="w-4 h-4 text-[#10b981]" />
                <span className="text-sm font-semibold text-[#10b981]">This Week</span>
              </div>
            </div>
            
            {dashboardData.weekSales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.weekSales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => value > 0 ? `₨${(value / 1000).toFixed(0)}k` : '₨0'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [`₨${value.toLocaleString()}`, 'Sales']}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                  <p className="text-[#64748b] font-medium">No sales data yet</p>
                  <p className="text-sm text-[#94a3b8] mt-1">Start taking orders to see your sales chart</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Popular Items - Takes 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-[#e2e8f0]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
                  <Package className="w-6 h-6 text-[#8b5cf6]" />
                  Popular Items
                </h2>
                <p className="text-sm text-[#64748b] mt-1">Best sellers</p>
              </div>
            </div>
            <div className="space-y-3">
              {dashboardData.popularItems.length > 0 ? (
                dashboardData.popularItems.map((item, index) => (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] rounded-xl hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0
                          ? 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]'
                          : index === 1
                          ? 'bg-gradient-to-br from-[#94a3b8] to-[#64748b]'
                          : index === 2
                          ? 'bg-gradient-to-br from-[#d97706] to-[#b45309]'
                          : 'bg-gradient-to-br from-[#10b981] to-[#059669]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1e293b] text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          ₨{item.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#10b981]">
                        {item.totalQuantity || 0}
                      </p>
                      <p className="text-xs text-[#64748b]">sold</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-[#cbd5e1] mx-auto mb-2" />
                  <p className="text-[#94a3b8] text-sm">No sales data yet</p>
                  <p className="text-xs text-[#cbd5e1] mt-1">Popular items will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[#d1fae5] text-sm">Avg Order Value</p>
                <p className="text-3xl font-bold">
                  ₨{dashboardData.todayOrders > 0 
                    ? Math.round(dashboardData.todaySales / dashboardData.todayOrders)
                    : 0}
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-sm text-[#d1fae5]">Per Transaction</p>
            </div>
          </div>

          {/* Cost Efficiency */}
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[#dbeafe] text-sm">Profit Margin</p>
                <p className="text-3xl font-bold">
                  {dashboardData.todaySales > 0
                    ? ((dashboardData.todayProfit / dashboardData.todaySales) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-sm text-[#dbeafe]">Cost Efficiency</p>
            </div>
          </div>

          {/* Total Items Sold */}
          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[#ede9fe] text-sm">Items Sold</p>
                <p className="text-3xl font-bold">
                  {dashboardData.popularItems.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)}
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-sm text-[#ede9fe]">Today's Total</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.a
            href="/pos"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-gradient-to-br from-[#10b981] to-[#059669] text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all"
          >
            <ShoppingCart className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-1">New Order</h3>
            <p className="text-sm text-[#d1fae5]">Create a new customer order</p>
          </motion.a>

          <motion.a
            href="/inventory"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all"
          >
            <Package className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-1">Manage Inventory</h3>
            <p className="text-sm text-[#dbeafe]">Update menu items and prices</p>
          </motion.a>

          <motion.a
            href="/reports"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all"
          >
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-1">View Reports</h3>
            <p className="text-sm text-[#ede9fe]">Analytics and insights</p>
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}