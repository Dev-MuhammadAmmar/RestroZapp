"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Mail, Lock, ArrowRight, CheckCircle, XCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [notification, setNotification] = useState(null)

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
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#1a4d4d] to-[#10b981] overflow-hidden">
      {/* Custom Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border"
            style={{
              background: notification.type === 'success' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
              borderColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : (
              <XCircle className="w-6 h-6 text-white" />
            )}
            <span className="text-white font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg px-6"
      >
        {/* Logo & Branding */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl shadow-2xl shadow-emerald-500/50"
          >
            <ChefHat className="w-12 h-12 text-white" strokeWidth={2.5} />
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="space-y-2"
          >
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Unsa Restaurant
            </h1>
            <p className="text-emerald-300 text-sm tracking-widest uppercase font-medium">
              Management System
            </p>
          </motion.div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          variants={itemVariants}
          className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl"
        >
          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 rounded-3xl" />
          
          {/* Corner Accents */}
          <div className="absolute -top-px -right-px w-24 h-24">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-emerald-400/30 to-transparent rounded-tr-3xl" />
          </div>
          <div className="absolute -bottom-px -left-px w-24 h-24">
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-teal-400/30 to-transparent rounded-bl-3xl" />
          </div>

          <motion.div variants={itemVariants} className="relative mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-emerald-200/80 text-sm">
              Sign in to access your dashboard
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="relative space-y-6">
            {/* Email Input */}
            <div className="relative group">
              <motion.div
                animate={{
                  scale: focusedInput === 'email' ? 1.02 : 1
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
                  <Mail className={`w-5 h-5 transition-all duration-300 ${
                    focusedInput === 'email' ? 'text-emerald-400 scale-110' : 'text-emerald-300/60'
                  }`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  placeholder="Email address"
                  className="w-full pl-14 pr-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-emerald-300/40 focus:bg-white/10 focus:border-emerald-400 focus:outline-none transition-all duration-300 text-lg"
                />
                {focusedInput === 'email' && (
                  <motion.div
                    layoutId="inputGlow"
                    className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.div>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <motion.div
                animate={{
                  scale: focusedInput === 'password' ? 1.02 : 1
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
                  <Lock className={`w-5 h-5 transition-all duration-300 ${
                    focusedInput === 'password' ? 'text-emerald-400 scale-110' : 'text-emerald-300/60'
                  }`} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  placeholder="Password"
                  className="w-full pl-14 pr-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-emerald-300/40 focus:bg-white/10 focus:border-emerald-400 focus:outline-none transition-all duration-300 text-lg"
                />
                {focusedInput === 'password' && (
                  <motion.div
                    layoutId="inputGlow"
                    className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.div>
            </div>

            {/* Login Button */}
            <motion.button
              onClick={handleLogin}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-5 mt-8 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group text-lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-8"
        >
          <p className="text-emerald-200/60 text-sm">
            🔒 Secure Admin Access
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}