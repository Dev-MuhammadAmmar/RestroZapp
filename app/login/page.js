"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Mail, Lock, ArrowRight, CheckCircle, XCircle , Eye , EyeOff , CheckCircle2 , AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [notification, setNotification] = useState(null)
   const [showPassword, setShowPassword] = useState(false)

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setTimeout(() => {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL 
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD 
      
      if (email === adminEmail && password === adminPassword) {
        localStorage.setItem('loggedIn', 'true')
        showNotification('success', 'Login successful! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        showNotification('error', 'Invalid credentials! Please try again.')
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  }

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      {/* Animated Background Orbs */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${
              notification.type === 'success' 
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
                : 'bg-red-50/90 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-5 shadow-lg shadow-emerald-500/30"
          >
            <ChefHat className="w-10 h-10 text-white" strokeWidth={2} />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Unsa Restaurant
          </h1>
          <p className="text-gray-600 text-sm font-medium">
            Management System
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-200/50 p-8 relative overflow-hidden"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-blue-50/30 pointer-events-none" />
          
          <div className="relative">
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-sm">
                Sign in to access your dashboard
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <motion.div 
                  className="relative"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/50"
                  />
                </motion.div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <motion.div 
                  className="relative"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/50"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </motion.div>
              </div>

              {/* Login Button */}
              <motion.button
                onClick={handleLogin}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-6"
        >
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Secure Admin Access
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}