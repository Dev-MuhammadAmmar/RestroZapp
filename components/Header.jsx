'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bell, User, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notificationCount] = useState(3)

  return (
    <motion.header
      className="bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 backdrop-blur-2xl border-b border-slate-200/60 sticky top-0 z-30 shadow-lg shadow-slate-200/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4">
        
        {/* Welcome Message - hidden on mobile */}
        <motion.div 
          className="hidden lg:block ml-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-slate-800">Welcome back! 👋</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Right Actions - notifications and profile */}
        <div className="flex items-center gap-2 ml-auto">
          
      

          {/* Profile Menu */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl transition-all duration-300 border-2 border-emerald-200/50 shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <User size={18} strokeWidth={2.5} className="text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">Admin User</p>
                <p className="text-xs text-slate-500 font-medium">Restaurant Manager</p>
              </div>
              <motion.div
                animate={{ rotate: showProfileMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={18} className="text-slate-600" strokeWidth={2.5} />
              </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-slate-200">
                      <p className="font-bold text-slate-800">Admin User</p>
                 
                    </div>
                    
                    <div className="py-2">
                  
                      <button onClick={() => { localStorage.removeItem("loggedIn"); window.location.href = "/login"; }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group">
                        <LogOut size={18} className="text-slate-600 group-hover:text-red-600 transition-colors" strokeWidth={2.2} />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-red-600">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
