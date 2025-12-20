
  'use client'
  import { useEffect, useState } from 'react'
  import { motion, AnimatePresence } from 'framer-motion'
  import Link from 'next/link'
  import { usePathname } from 'next/navigation'
  import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Menu,
    X,
    ChefHat,
    ClipboardList,
    SettingsIcon,
    Users,
  } from 'lucide-react'
import { getSettings } from '@/lib/actions/settings'





  export default function Sidebar() {

const [restaurantSettings, setRestaurantSettings] = useState(null)

useEffect(() => {
  const fetchSettings = async () => {
    try {
      const response = await getSettings()
      if (response.success) {
        setRestaurantSettings(response.data.restaurantName)
      }
    } catch (error) {
      console.error('Error loading restaurant settings:', error)
    }
  }

  fetchSettings()
}, [])

    const pathname = usePathname() || ''
    const [isOpen, setIsOpen] = useState(false)

    const menuItems = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
      { icon: ShoppingCart, label: 'POS', href: '/pos' },
      { icon: Package, label: 'Inventory', href: '/inventory' },
      { icon: ChefHat, label: 'Grocery', href: '/grocery' },
      { icon: ClipboardList, label: 'Orders', href: '/orders' },
      { icon: BarChart3, label: 'Reports', href: '/reports' },
      { icon: Users, label: 'Customers', href: '/customers' },

      { icon: SettingsIcon, label: 'Settings', href: '/settings' },
    ]

    // Close mobile menu on desktop resize
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 1024) setIsOpen(false)
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    const isActive = (href) => {
      if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard'
      return pathname.startsWith(href)
    }

    return (
      <>
        {/* Mobile Menu Button */}
        <motion.button
          onClick={() => setIsOpen((s) => !s)}
          className="lg:hidden fixed top-5 left-5 z-50 p-3 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-xl hover:shadow-emerald-500/50 backdrop-blur-sm"
          aria-label="Toggle menu"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={22} strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={22} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-30"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white z-40 shadow-2xl border-r border-emerald-500/20 transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
        >
      
          {/* Header */}
          <motion.div
            className="relative p-8 border-b border-slate-700/50 overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl" />

            <div className="relative flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <ChefHat size={28} strokeWidth={2.5} />
              </motion.div>

              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                  {restaurantSettings ? restaurantSettings: 'Restaurant'}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-semibold tracking-wider uppercase">
                  Management System
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="relative p-5 mt-2" role="navigation" aria-label="Main navigation">
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Active = isActive(item.href)
                return (
                  <motion.li

                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.08 + 0.3,
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                    }}
                  >
                      <Link href={item.href} onClick={() => setIsOpen(false)} className="relative tracking-wide">
                    <motion.div
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-semibold text-sm relative overflow-hidden group ${
                        Active
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white shadow-xl shadow-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white hover:shadow-lg hover:shadow-slate-900/50'
                      }`}
                      whileHover={{ x: Active ? 0 : 8 }}
                      whileTap={{ scale: 0.97 }}
                      aria-current={Active ? 'page' : undefined}
                    >
                  

                      {/* Hover glow effect */}
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative flex items-center gap-4 w-full">
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                          <item.icon size={22} strokeWidth={Active ? 2.5 : 2.2} className={Active ? 'drop-shadow-lg' : ''} />
                        </motion.div>
                      
                          {item.label}
                      </div>

                      {/* Active indicator */}
                      {Active && <motion.div layoutId="activeTab" className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                    </motion.div>
                        </Link>
                  </motion.li>
                )
              })}
            </ul>
          </nav>

          {/* Footer decoration */}
          <motion.div className="absolute bottom-8 left-8 right-8 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">System Active</span>
            </div>
          </motion.div>
        </motion.aside>
      </>
    )
  }