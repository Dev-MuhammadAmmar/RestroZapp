'use client'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

const salesData = [
  { day: 'Mon', sales: 3400, orders: 24 },
  { day: 'Tue', sales: 4200, orders: 31 },
  { day: 'Wed', sales: 3800, orders: 28 },
  { day: 'Thu', sales: 5100, orders: 38 },
  { day: 'Fri', sales: 6200, orders: 45 },
  { day: 'Sat', sales: 7800, orders: 52 },
  { day: 'Sun', sales: 6500, orders: 48 },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export default function SalesChart() {
  return (
    <motion.div 
      className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    >
      <motion.div 
        className="flex items-start justify-between mb-4 sm:mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Weekly Sales Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Sales and order trends for the past week</p>
        </div>
        <motion.div 
          className="p-2 bg-emerald-50 rounded-lg hidden sm:block"
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          <TrendingUp className="text-emerald-600" size={20} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={280} className="sm:h-80">
          <AreaChart data={salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              style={{ fontSize: '11px', fontWeight: 600 }} 
              tickMargin={10}
            />
            <YAxis 
              stroke="#64748b" 
              style={{ fontSize: '11px', fontWeight: 600 }} 
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontWeight: 600,
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} 
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#10b981" 
              strokeWidth={3} 
              fill="url(#salesGradient)" 
              name="Sales ($)" 
            />
            <Area 
              type="monotone" 
              dataKey="orders" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fill="url(#ordersGradient)" 
              name="Orders" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}