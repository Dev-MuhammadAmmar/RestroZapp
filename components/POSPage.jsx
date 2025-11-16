'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  Check,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag,
  Receipt,
  Coffee,
  Phone,
  MapPin,
  Hash,
  User,
  DollarSign,
  Percent,
  Package,
  Truck,
  ChefHat,
  Timer,
  ClipboardList,
  Loader2,
  RefreshCw,
  Keyboard,
  Info,
  Grid3x3,
  CreditCard,
  Bike,
  BadgePercent,
  MessageSquare,
} from 'lucide-react'

// Import server actions
import { getCategories } from '@/lib/actions/categories'
import { getActiveMenuItems } from '@/lib/actions/menuItems'
import { createOrder, getPendingOrders, completeOrder } from '@/lib/actions/orders'
import { getSettings } from '@/lib/actions/settings'

const ORDER_TYPES = [
  { value: 'dine-in', label: 'Dine In', icon: UtensilsCrossed, color: 'from-blue-500 to-cyan-500' },
  { value: 'takeaway', label: 'Takeaway', icon: Package, color: 'from-purple-500 to-pink-500' },
  { value: 'delivery', label: 'Delivery', icon: Truck, color: 'from-orange-500 to-red-500' },
]

const PAYMENT_METHODS = ['Cash', 'Card', 'Online', 'Other']

export default function POSPage() {
  // Data states
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  
  // UI states
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isPendingOrdersOpen, setIsPendingOrdersOpen] = useState(false)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)
  const [notification, setNotification] = useState(null)
  const [printType, setPrintType] = useState(null)
  const [currentPrintOrder, setCurrentPrintOrder] = useState(null)
  
  // Loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(true)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [isLoadingPendingOrders, setIsLoadingPendingOrders] = useState(false)
  const [restaurantSettings, setRestaurantSettings] = useState(null)

  
  // Order details
  const [orderDetails, setOrderDetails] = useState({
    orderType: 'dine-in',
    tableNumber: '',
    paymentMethod: 'Cash',
    customerName: '',
    phoneNumber: '',
    address: '',
    discountPercentage: 0,
    deliveryCharge: 0,
    taxPercentage: 0 ,
    notes: '',
  })

  // Search dropdown
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const searchDropdownRef = useRef(null)
  const orderDetailsRef = useRef(orderDetails)

  // Load initial data
  useEffect(() => {
    loadCategories()
    loadMenuItems()
    loadPendingOrders()
      loadRestaurantSettings() 
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await getCategories()
      if (response.success) {
        const activeCategories = response.data.filter(cat => cat.isActive)
        setCategories(activeCategories)
      } else {
        console.error('Error loading categories:', response.error)
        showNotification('Failed to load categories', 'error')
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      showNotification('Failed to load categories', 'error')
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenuItems(true)
      const response = await getActiveMenuItems()
      if (response.success) {
        setMenuItems(response.data)
      } else {
        console.error('Error loading menu items:', response.error)
        showNotification('Failed to load menu items', 'error')
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
      showNotification('Failed to load menu items', 'error')
    } finally {
      setIsLoadingMenuItems(false)
    }
  }

  const loadPendingOrders = async () => {
    try {
      setIsLoadingPendingOrders(true)
      const response = await getPendingOrders()
      if (response.success) {
        setPendingOrders(response.data)
      } else {
        console.error('Error loading pending orders:', response.error)
        showNotification('Failed to load pending orders', 'error')
      }
    } catch (error) {
      console.error('Error loading pending orders:', error)
      showNotification('Failed to load pending orders', 'error')
    } finally {
      setIsLoadingPendingOrders(false)
    }
  }
const loadRestaurantSettings = async () => {
  try {
    const response = await getSettings()
    if (response.success) {
      setRestaurantSettings(response.data)
      // Update tax percentage from settings
      setOrderDetails(prev => ({
        ...prev,
        taxPercentage: response.data.taxPercentage || 0, 
    
      }))
    }
  } catch (error) {
    console.error('Error loading restaurant settings:', error)
  }
}
  // Auto-update delivery charge based on order type
 // Auto-update delivery charge and tax based on order type
   useEffect(() => {
    if (orderDetails.orderType === 'delivery' && orderDetails.deliveryCharge === 0) {
      setOrderDetails(prev => ({ ...prev, deliveryCharge: restaurantSettings?.deliveryCharges || 50 }))
    } else if (orderDetails.orderType !== 'delivery') {
      setOrderDetails(prev => ({ ...prev, deliveryCharge: 0 }))
    }
    
    // Set tax percentage based on order type
    if (orderDetails.orderType === 'dine-in') {
      setOrderDetails(prev => ({ ...prev, taxPercentage: restaurantSettings?.taxPercentage || 0 }))
    } else {
      setOrderDetails(prev => ({ ...prev, taxPercentage: 0 }))
    }
  }, [orderDetails.orderType, restaurantSettings?.taxPercentage])
  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
  const tax = subtotal * (orderDetails.taxPercentage / 100)
  const discountAmount = (subtotal * orderDetails.discountPercentage) / 100
  const total = subtotal + tax - discountAmount + orderDetails.deliveryCharge

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filtered)
      setShowSearchDropdown(true)
      setSelectedSearchIndex(-1)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
      setSelectedSearchIndex(-1)
    }
  }, [searchQuery, menuItems])

  const handleSearchKeyDown = (e) => {
    if (!showSearchDropdown || searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSearchIndex((prev) => prev < searchResults.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSearchIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSearchIndex >= 0) {
        addToCart(searchResults[selectedSearchIndex])
        setSearchQuery('')
        setShowSearchDropdown(false)
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter products
  const filteredProducts = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || 
      (item.categoryId && item.categoryId.name === selectedCategory)
    return matchesCategory
  })

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Cart operations
  const addToCart = (menuItem) => {
    const existingItem = cart.find((item) => item._id === menuItem._id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === menuItem._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
      showNotification(`${menuItem.name} quantity increased`, 'success')
    } else {
      setCart([...cart, { ...menuItem, quantity: 1 }])
      showNotification(`${menuItem.name} added to cart`, 'success')
    }
  }

  const updateQuantity = (id, change) => {
    setCart(
      cart
        .map((item) => {
          if (item._id === id) {
            const newQuantity = item.quantity + change
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    const item = cart.find((i) => i._id === id)
    setCart(cart.filter((item) => item._id !== id))
    showNotification(`${item.name} removed`, 'success')
  }

  const clearCart = () => {
    if (cart.length === 0) return
    setCart([])
    showNotification('Cart cleared', 'success')
  }

  // Order operations
  const confirmOrder = () => {
    if (cart.length === 0) {
      showNotification('Cart is empty', 'error')
      return
    }
    setIsOrderModalOpen(true)
  }
const submitOrder = async () => {
  const currentDetails = orderDetailsRef.current
  
  // Validation
  if (currentDetails.orderType === 'dine-in' && !currentDetails.tableNumber.trim()) {
    showNotification('Please enter table number', 'error')
    return
  }
  if (currentDetails.orderType === 'delivery') {
    if (!currentDetails.customerName.trim() || !currentDetails.phoneNumber.trim() || !currentDetails.address.trim()) {
      showNotification('Please fill all delivery details', 'error')
      return
    }
  }

  setIsSubmittingOrder(true)

  try {
    const orderData = {
      items: cart.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.sellingPrice,
        quantity: item.quantity,
        categoryId: item.categoryId
      })),
      orderType: currentDetails.orderType,
      subtotal,
      tax,
      taxPercentage: currentDetails.taxPercentage,
      discount: discountAmount,
      discountPercentage: currentDetails.discountPercentage,
      deliveryCharge: currentDetails.deliveryCharge,
      total,
      paymentMethod: currentDetails.paymentMethod,
      customerName: currentDetails.customerName || 'Guest',
      phoneNumber: currentDetails.phoneNumber || null,
      tableNumber: currentDetails.tableNumber || null,
      address: currentDetails.address || null,
      notes: currentDetails.notes || null
    }

    const response = await createOrder(orderData)

    if (response.success) {
      // Set for printing
      setCurrentPrintOrder(response.data)
      setIsOrderModalOpen(false)

      // Print KOT first
      setPrintType('kot')
      setTimeout(() => {
        window.print()
        
        // After KOT, print customer ticket for takeaway - USE currentDetails here!
        if (currentDetails.orderType === 'takeaway') {
          setTimeout(() => {
            setPrintType('customer-ticket')
            setTimeout(() => {
              window.print()
              finalizePendingOrder(response.data)
            }, 100)
          }, 500)
        } else {
          finalizePendingOrder(response.data)
        }
      }, 100)
    } else {
      showNotification(response.error || 'Failed to create order', 'error')
    }
  } catch (error) {
    showNotification('Error creating order', 'error')
    console.error('Order creation error:', error)
  } finally {
    setIsSubmittingOrder(false)
  }
}
useEffect(() => {
  orderDetailsRef.current = orderDetails
}, [orderDetails])

const finalizePendingOrder = async (order) => {
  await loadPendingOrders()
  setCart([])
  setOrderDetails({
    orderType: 'dine-in',
    tableNumber: '',
    paymentMethod: 'Cash',
    customerName: '',
    phoneNumber: '',
    address: '',
    discountPercentage: 0,
    deliveryCharge: 0,
    taxPercentage: restaurantSettings?.taxPercentage || 0,  // Changed this line
    notes: '',
  })
  setPrintType(null)
  setCurrentPrintOrder(null)
  showNotification('Order sent to kitchen!', 'success')
}

  const completeOrderHandler = async (orderId) => {
    try {
      const order = pendingOrders.find(o => o._id === orderId)
      if (!order) return

      setCurrentPrintOrder({ ...order, status: 'completed' })
      setPrintType('bill')
      
      setTimeout(async () => {
        window.print()
        
        setTimeout(async () => {
          const response = await completeOrder(orderId)
          if (response.success) {
            await loadPendingOrders() // Refresh pending orders list
            setPrintType(null)
            setCurrentPrintOrder(null)
            showNotification('Order completed!', 'success')
          } else {
            showNotification(response.error || 'Error completing order', 'error')
          }
        }, 500)
      }, 100)
    } catch (error) {
      showNotification('Error completing order', 'error')
      console.error('Complete order error:', error)
    }
  }

  const refreshData = async () => {
    await Promise.all([
      loadCategories(),
      loadMenuItems(),
      loadPendingOrders()
    ])
    showNotification('Data refreshed', 'success')
  }

// Keyboard shortcuts
useEffect(() => {
  const handleKeyboard = (e) => {
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'

    // Ctrl/Cmd + C - Confirm Order (skip if typing, except for copy)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (isTyping) return // Allow normal copy
      e.preventDefault()
      if (cart.length > 0 && !isOrderModalOpen) {
        confirmOrder()
      }
    }

    // Ctrl/Cmd + K - Send to Kitchen (works even when typing in modal)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      if (isOrderModalOpen && !isSubmittingOrder) {
        submitOrder()
      }
    }

    // Ctrl/Cmd + P - Pending Orders
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault()
      setIsPendingOrdersOpen(!isPendingOrdersOpen)
    }

    // Ctrl/Cmd + D - Clear Cart (skip if typing)
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      if (isTyping) return
      e.preventDefault()
      clearCart()
    }

    // Ctrl/Cmd + F - Focus Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault()
      searchInputRef.current?.focus()
    }

    // Escape - Close modals (works everywhere)
    if (e.key === 'Escape') {
      if (isOrderModalOpen) setIsOrderModalOpen(false)
      if (isPendingOrdersOpen) setIsPendingOrdersOpen(false)
      if (isShortcutsModalOpen) setIsShortcutsModalOpen(false)
      if (showSearchDropdown) setShowSearchDropdown(false)
    }

    // ? - Show shortcuts (skip if typing)
    if (e.key === '?' && !e.shiftKey) {
      if (isTyping) return
      e.preventDefault()
      setIsShortcutsModalOpen(!isShortcutsModalOpen)
    }
  }

  window.addEventListener('keydown', handleKeyboard)
  return () => window.removeEventListener('keydown', handleKeyboard)
}, [cart, isOrderModalOpen, isPendingOrdersOpen, isSubmittingOrder, isShortcutsModalOpen, showSearchDropdown])
    return (
    <>
      {/* Main UI */}
      <div className="print:hidden  bg-gradient-to-br from-slate-50 via-white to-slate-100 p-2 sm:p-3 md:p-4 lg:p-6">
        <div className="max-w-[2000px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 sm:mb-4 lg:mb-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl shadow-lg">
                    <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  Point of Sale
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 ml-1">
                  Fast billing & order management
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <motion.button
                  onClick={() => setIsShortcutsModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-emerald-500 transition-all"
                  title="Keyboard Shortcuts (?)"
                >
                  <Keyboard className="w-4 h-4 text-slate-600" />
                </motion.button>
                <motion.button
                  onClick={refreshData}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-emerald-500 transition-all"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </motion.button>
                <motion.button
                  onClick={() => setIsPendingOrdersOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg sm:rounded-xl shadow-lg font-semibold text-sm relative"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">Pending Orders</span>
                  <span className="sm:hidden">Orders</span>
                  {pendingOrders.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                      {pendingOrders.length}
                    </span>
                  )}
                </motion.button>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -50, x: '-50%' }}
                className={`fixed top-4 left-1/2 z-[9999] flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-2xl backdrop-blur-sm text-sm sm:text-base ${
                  notification.type === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Products Section */}
            <div className="xl:col-span-2 space-y-3 sm:space-y-4">
              {/* Search & Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100"
              >
                {/* Search */}
                <div className="relative mb-3 sm:mb-4">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus
                    placeholder="Search menu... (Ctrl+F)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => searchQuery && setShowSearchDropdown(true)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 font-medium text-sm sm:text-base"
                  />
                  
                  {/* Search Dropdown */}
                  <AnimatePresence>
                    {showSearchDropdown && searchResults.length > 0 && (
                      <motion.div
                        ref={searchDropdownRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-60 sm:max-h-80 overflow-y-auto"
                      >
                        <div className="p-1.5 sm:p-2">
                          {searchResults.map((product, index) => (
                            <motion.button
                              key={product._id}
                              onClick={() => {
                                addToCart(product)
                                setSearchQuery('')
                                setShowSearchDropdown(false)
                              }}
                              onMouseEnter={() => setSelectedSearchIndex(index)}
                              className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all text-left ${
                                selectedSearchIndex === index
                                  ? 'bg-emerald-50 border-2 border-emerald-500'
                                  : 'hover:bg-slate-50 border-2 border-transparent'
                              }`}
                              whileHover={{ x: 4 }}
                            >
                              <div className="text-2xl sm:text-3xl">{product.categoryId?.icon || '🍽️'}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-slate-500">{product.categoryId?.name || 'Uncategorized'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600 text-sm">₨{product.sellingPrice}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory('All')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      selectedCategory === 'All'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Items
                  </motion.button>
                  {categories.map((category) => (
                    <motion.button
                      key={category._id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                        selectedCategory === category.name
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                      {category.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Menu Items Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border h-[50vh] overflow-x-scroll border-slate-100"
              >
                {isLoadingMenuItems ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <Coffee className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-semibold text-base sm:text-lg">No items found</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">
                      Try selecting a different category
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                    {filteredProducts.map((item, index) => (
                      <motion.button
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(item)}
                        className="bg-gradient-to-br from-white to-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border-2 border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all group"
                      >
                        <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                          {item.categoryId?.icon || '🍽️'}
                        </div>
                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500 truncate">{item.categoryId?.name}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-emerald-600 font-bold text-base sm:text-lg">
                            ₨{item.sellingPrice}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1 text-xs text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3" />
                          Add to Cart
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Cart Section */}
            <div className="xl:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-slate-100 sticky top-4 overflow-hidden"
              >
                {/* Cart Header */}
                <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold">Current Order</h2>
                      <p className="text-emerald-100 text-xs">
                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <p className="text-xl sm:text-2xl font-bold">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="p-3 sm:p-4 max-h-[350px] sm:max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-slate-100">
                  <AnimatePresence>
                    {cart.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 sm:py-16"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-semibold text-sm sm:text-base">Cart is empty</p>
                        <p className="text-slate-400 text-xs sm:text-sm mt-2">
                          Start adding items
                        </p>
                      </motion.div>
                    ) : (
                      cart.map((item, index) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg sm:rounded-xl mb-2 sm:mb-3 border-2 border-slate-100 hover:border-emerald-300 transition-all group"
                        >
                          <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                            {item.categoryId?.icon || '🍽️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                              {item.name}
                            </h3>
                            <p className="text-emerald-600 font-bold text-xs sm:text-sm">
                              ₨{item.sellingPrice} × {item.quantity}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold">
                              Total: ₨{(item.sellingPrice * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:gap-2">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-md sm:rounded-lg p-0.5 sm:p-1">
                              <button
                                onClick={() => updateQuantity(item._id, -1)}
                                className="p-0.5 sm:p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </button>
                              <span className="w-5 sm:w-7 text-center font-bold text-slate-800 text-xs sm:text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item._id, 1)}
                                className="p-0.5 sm:p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="p-1 sm:p-1.5 bg-red-100 text-red-600 rounded-md sm:rounded-lg hover:bg-red-200 transition-colors w-full"
                            >
                              <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mx-auto" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Cart Summary */}
                {cart.length > 0 && (
                  <div className="p-3 sm:p-4 border-t-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-bold">₨{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                        <span className="font-medium">Service Charges ({orderDetails.taxPercentage}%):</span>
                        <span className="font-bold">₨{tax.toFixed(2)}</span>
                      </div>
                      {orderDetails.deliveryCharge > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm text-orange-600">
                          <span className="font-medium">Delivery:</span>
                          <span className="font-bold">₨{orderDetails.deliveryCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {orderDetails.discountPercentage > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm text-emerald-600">
                          <span className="font-medium">Discount ({orderDetails.discountPercentage}%):</span>
                          <span className="font-bold">-₨{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-1.5 sm:my-2" />
                      <div className="flex justify-between text-base sm:text-lg font-bold text-slate-800 pt-1.5 sm:pt-2">
                        <span>Total:</span>
                        <span className="text-xl sm:text-2xl text-emerald-600">₨{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <motion.button
                        onClick={confirmOrder}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        Confirm Order
                        <span className="text-xs opacity-75 ml-1">(Ctrl+C)</span>
                      </motion.button>
                      <motion.button
                        onClick={clearCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2 sm:py-2.5 bg-red-100 text-red-600 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        Clear Cart
                        <span className="text-xs opacity-75 ml-1">(Ctrl+D)</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {isShortcutsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="print:hidden fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={() => setIsShortcutsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                    <Keyboard className="w-5 h-5 sm:w-7 sm:h-7" />
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Boost your productivity
                  </p>
                </div>
                <button
                  onClick={() => setIsShortcutsModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                {[
                  { keys: ['Ctrl', 'F'], action: 'Focus Search', desc: 'Quick search menu items' },
                  { keys: ['Ctrl', 'C'], action: 'Confirm Order', desc: 'Open order confirmation' },
                  { keys: ['Ctrl', 'K'], action: 'Send to Kitchen', desc: 'Submit order (from modal)' },
                  { keys: ['Ctrl', 'P'], action: 'Pending Orders', desc: 'View pending orders' },
                  { keys: ['Ctrl', 'D'], action: 'Clear Cart', desc: 'Remove all items' },
                  { keys: ['Esc'], action: 'Close Modal', desc: 'Close any open modal' },
                  { keys: ['?'], action: 'Show Shortcuts', desc: 'Toggle this help' },
                  { keys: ['↑', '↓'], action: 'Navigate Search', desc: 'Move through search results' },
                  { keys: ['Enter'], action: 'Select Item', desc: 'Add item from search' },
                ].map((shortcut, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm sm:text-base">{shortcut.action}</p>
                      <p className="text-xs text-slate-500">{shortcut.desc}</p>
                    </div>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-slate-800 text-white rounded text-xs font-mono font-bold"
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-600">
                  Press <kbd className="px-2 py-1 bg-slate-200 rounded font-mono">?</kbd> anytime to toggle shortcuts
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     {/* Order Modal - Horizontal Layout */}
<AnimatePresence>
  {isOrderModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="print:hidden fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 z-50"
      onClick={() => !isSubmittingOrder && setIsOrderModalOpen(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-7xl h-full sm:h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header - Compact on mobile */}
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white p-3 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0" />
              <span className="truncate">Confirm Order</span>
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">
              Review order details and submit
            </p>
          </div>
          <button
            onClick={() => !isSubmittingOrder && setIsOrderModalOpen(false)}
            disabled={isSubmittingOrder}
            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Main Content - Stack on mobile, side-by-side on desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Side - Order Summary */}
          <div className="w-full md:w-[35%] lg:w-[30%] bg-gradient-to-br from-emerald-50 to-teal-50 p-3 sm:p-6 border-b-2 md:border-b-0 md:border-r-2 border-emerald-200 flex flex-col max-h-[35vh] md:max-h-none">
            <h3 className="font-bold text-slate-800 mb-2 sm:mb-4 flex items-center gap-2 text-sm sm:text-lg flex-shrink-0">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              Order Summary
            </h3>

            {/* Scrollable Items - Compact on mobile */}
            <div className="flex-1 space-y-1.5 sm:space-y-2 overflow-y-auto mb-2 sm:mb-4 pr-1 custom-scrollbar">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between text-xs sm:text-sm bg-white/80 backdrop-blur-sm p-2 sm:p-3  rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <span className="text-base sm:text-2xl flex-shrink-0">{item.categoryId?.icon || '🍽️'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate text-xs sm:text-sm">{item.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        ₨{item.sellingPrice} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 ml-2 flex-shrink-0 text-xs sm:text-sm">
                    ₨{(item.sellingPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown - Compact on mobile */}
            <div className="border-t-2 border-emerald-200 pt-2 sm:pt-4 space-y-1.5 sm:space-y-2 bg-white/50 p-2 sm:p-4 rounded-xl text-xs sm:text-sm flex-shrink-0">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₨{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service Charges ({orderDetails.taxPercentage}%):</span>
                <span className="font-semibold">₨{tax.toFixed(2)}</span>
              </div>
              {orderDetails.deliveryCharge > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Delivery:</span>
                  <span className="font-semibold">₨{orderDetails.deliveryCharge.toFixed(2)}</span>
                </div>
              )}
              {orderDetails.discountPercentage > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-₨{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-xl font-bold text-slate-800 pt-1.5 sm:pt-2 border-t border-emerald-200">
                <span>Total:</span>
                <span className="text-emerald-600">₨{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Order Details Form */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
              {/* Order Type - Grid adjusts for mobile */}
              <div>
                <label className="block text-slate-700 font-bold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  Order Type *
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {ORDER_TYPES.map((type) => (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        setOrderDetails({ ...orderDetails, orderType: type.value })
                      }
                      disabled={isSubmittingOrder}
                      className={`p-2 sm:p-5 sm:py-1 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-3 disabled:opacity-50 ${
                        orderDetails.orderType === type.value
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <type.icon
                        className={`w-5 h-5 sm:w-8 sm:h-8 ${
                          orderDetails.orderType === type.value
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={`font-bold text-[10px] sm:text-sm text-center ${
                          orderDetails.orderType === type.value
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {type.label}
                      </span>
                      {orderDetails.orderType === type.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 sm:w-6 sm:h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs - Full width on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {orderDetails.orderType === 'dine-in' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                      <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      Table Number *
                    </label>
                    <input
                      type="text"
                      value={orderDetails.tableNumber}
                      onChange={(e) =>
                        setOrderDetails({ ...orderDetails, tableNumber: e.target.value })
                      }
                      disabled={isSubmittingOrder}
                      autoFocus 
                      placeholder="e.g., T-5"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-sm sm:text-base"
                    />
                  </div>
                )}

                {(orderDetails.orderType === 'takeaway' || orderDetails.orderType === 'delivery') && (
                  <>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        autoFocus 
                        value={orderDetails.customerName}
                        onChange={(e) =>
                          setOrderDetails({ ...orderDetails, customerName: e.target.value })
                        }
                        disabled={isSubmittingOrder}
                        placeholder={`Enter name ${orderDetails.orderType==="takeaway"?"(Optional)":""}`}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={orderDetails.phoneNumber}
                        onChange={(e) =>
                          setOrderDetails({ ...orderDetails, phoneNumber: e.target.value })
                        }
                        disabled={isSubmittingOrder}
                        placeholder={`03XX-XXXXXXX ${orderDetails.orderType==="takeaway"?"(Optional)":""}`}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-sm sm:text-base"
                      />
                    </div>
                  </>
                )}

                {orderDetails.orderType === 'delivery' && (
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      Delivery Address *
                    </label>
                    <textarea
                      value={orderDetails.address}
                      autoFocus
                      onChange={(e) =>
                        setOrderDetails({ ...orderDetails, address: e.target.value })
                      }
                      disabled={isSubmittingOrder}
                      placeholder="Enter complete address"
                      rows={2}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none disabled:opacity-50 text-sm sm:text-base"
                    />
                  </div>
                )}
              </div>

              {/* Payment & Charges - 2 columns on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Payment
                  </label>
                  <select
                    value={orderDetails.paymentMethod}
                    onChange={(e) =>
                      setOrderDetails({ ...orderDetails, paymentMethod: e.target.value })
                    }
                    disabled={isSubmittingOrder}
                    className="w-full px-2 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-xs sm:text-base"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>

          



            { orderDetails.orderType==="dine-in" &&  (  
              <>
              
                   <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                   Service Charges %
                  </label>
                  <input
                    type="number"
                    value={orderDetails.taxPercentage}
                    onChange={(e) =>
                      setOrderDetails({ ...orderDetails, taxPercentage: parseFloat(e.target.value) || 0 })
                    }
                    disabled={isSubmittingOrder}
                    min="0"
                    step="0.5"
                    className="w-full px-2 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-xs sm:text-base"
                  />
                </div>
               
</>
                )}
            { orderDetails.orderType==="delivery" &&  (  
              <>
              
                <div>
              
              <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Delivery
                  </label>
                  <input
                    type="number"
                    value={orderDetails.deliveryCharge}
                    onChange={(e) =>
                      setOrderDetails({ ...orderDetails, deliveryCharge: parseFloat(e.target.value) || 0 })
                    }
                    disabled={isSubmittingOrder|| orderDetails.orderType==="dine-in" || orderDetails.orderType==="takeaway"}
                    min="0"
                    className="w-full px-2 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-xs sm:text-base"
                  />
                </div>
</>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                    <BadgePercent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={orderDetails.discountPercentage}
                    onChange={(e) =>
                      setOrderDetails({ ...orderDetails, discountPercentage: parseFloat(e.target.value) || 0 })
                    }
                    disabled={isSubmittingOrder}
                    min="0"
                    max="100"
                    className="w-full px-2 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-xs sm:text-base"
                  />
                </div>
              </div>

              {/* Notes - Optional */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  Order Notes (Optional)
                </label>
                <input
                  value={orderDetails.notes}
                  onChange={(e) =>
                    setOrderDetails({ ...orderDetails, notes: e.target.value })
                  }
                  disabled={isSubmittingOrder}
                  placeholder="Special instructions..."
                  rows={2}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none disabled:opacity-50 text-sm sm:text-base"
                />
              </div>

              {/* Buttons - Stack on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sticky bottom-0 sm:static bg-white sm:bg-transparent pb-2 sm:pb-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOrderModalOpen(false)}
                  disabled={isSubmittingOrder}
                  className="w-full sm:flex-1 py-2.5 sm:py-4 border-2 border-slate-200 text-slate-600 rounded-lg sm:rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitOrder}
                  disabled={isSubmittingOrder}
                  className="w-full sm:flex-[2] py-2.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg sm:rounded-xl font-bold hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ChefHat
                       className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Send to Kitchen</span>
                      <span className="text-[10px] sm:text-xs opacity-75 hidden sm:inline">(Ctrl+K)</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<style jsx>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  
  @media (max-width: 640px) {
    .custom-scrollbar::-webkit-scrollbar {
      width: 3px;
    }
  }
`}</style>
      {/* Pending Orders Modal */}
      <AnimatePresence>
        {isPendingOrdersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="print:hidden fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={() => setIsPendingOrdersOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                    <Timer className="w-5 h-5 sm:w-7 sm:h-7" />
                    Pending Orders
                  </h2>
                  <p className="text-orange-100 text-xs sm:text-sm mt-1">
                    {pendingOrders.length} orders in queue
                  </p>
                </div>
                <button
                  onClick={() => setIsPendingOrdersOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {isLoadingPendingOrders ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-semibold text-base sm:text-lg">No pending orders</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">
                      Orders will appear here once confirmed
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingOrders.map((order, index) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200 hover:shadow-lg transition-all"
                      >
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-orange-200">
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{order.orderNumber}</h3>
                            <p className="text-xs text-slate-500">
                              {new Date(order.orderDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.orderType === 'dine-in' 
                              ? 'bg-blue-500 text-white'
                              : order.orderType === 'takeaway'
                              ? 'bg-purple-500 text-white'
                              : 'bg-orange-500 text-white'
                          }`}>
                            {order.orderType === 'dine-in' && '🍽️ Dine-In'}
                            {order.orderType === 'takeaway' && '📦 Takeaway'}
                            {order.orderType === 'delivery' && '🚚 Delivery'}
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-2 mb-3">
                          {order.orderType === 'dine-in' && order.tableNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Hash className="w-4 h-4 text-slate-600" />
                              <span className="font-semibold text-slate-700">
                                Table: {order.tableNumber}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-600" />
                            <span className="font-medium text-slate-700">{order.customerName}</span>
                          </div>
                          {order.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-slate-600" />
                              <span className="text-slate-600">{order.phoneNumber}</span>
                            </div>
                          )}
                          {order.address && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-slate-600 mt-0.5" />
                              <span className="text-slate-600 text-xs">{order.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Items List */}
                        <div className="mb-3 bg-white/60 rounded-lg p-2 max-h-32 overflow-y-auto">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs py-1">
                              <span className="font-medium text-slate-700">
                                {item.icon} {item.name} x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center mb-3 pb-3 border-t-2 border-orange-200 pt-3">
                          <span className="font-bold text-slate-700">Total:</span>
                          <span className="font-bold text-orange-600 text-lg">
                            ₨{order.total.toFixed(2)}
                          </span>
                        </div>

                        {/* Action Button */}
                        <motion.button
                          onClick={() => completeOrderHandler(order._id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete & Print Bill
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Templates - Hidden from UI */}
      {/* Print Templates - Hidden from UI */}
    {currentPrintOrder && (
        <>
          {/* KOT - Kitchen Order Ticket */}
          {printType === 'kot' && (
            <div className="hidden print:block print-content">
              <div className="receipt-container">
                <div className="text-center border-b-2 border-black">
                  <h1 className="text-2xl font-bold">KOT</h1>
                  <p className="text-xs">KITCHEN ORDER TICKET</p>
                </div>

                <div className="text-xs border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span className="font-bold">Order#:</span>
                    <span className="font-bold">{currentPrintOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{new Date(currentPrintOrder.orderDate || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Type:</span>
                    <span className="font-bold uppercase">{currentPrintOrder.orderType}</span>
                  </div>
                  {currentPrintOrder.orderType === 'dine-in' && currentPrintOrder.tableNumber && (
                    <div className="flex justify-between">
                      <span className="font-bold">Table:</span>
                      <span className="font-bold text-base">{currentPrintOrder.tableNumber}</span>
                    </div>
                  )}
            
                </div>

                <div>
                  <h3 className="font-bold text-sm border-b border-black">ITEMS:</h3>
                  {currentPrintOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between border-b border-dashed border-gray-400">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {currentPrintOrder.notes && (
                  <div className="border-t border-dashed border-black">
                    <p className="font-bold text-xs">NOTES:</p>
                    <p className="text-[10px]">{currentPrintOrder.notes}</p>
                  </div>
                )}

                <div className="text-center text-xs border-t-2 border-black">
     
                  <p className="text-[10px] mt-1">Print time: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Waiting Ticket - For Takeaway */}
          {printType === 'customer-ticket' && (
            <div className="hidden print:block print-content">
              <div className="receipt-container">
                <div className="text-center mb-1 border-b-2 border-dashed border-black pb-1">
                  <h1 className="text-2xl font-bold uppercase"> {restaurantSettings?.restaurantName || 'RESTAURANT'}</h1>
                  <p className="text-xs">{restaurantSettings?.address || ''}</p>
                  <p className="text-xs">{restaurantSettings?.phone1 || ''}{restaurantSettings?.phone2 ? ` | ${restaurantSettings.phone2}` : ''}</p>
                  <p className="text-sm font-bold">WAITING TOKEN</p>
                </div>

                <div className="text-center mb-1">
                  <div className="border-4 flex justify-between items-center  border-black rounded-lg p-1 mb-1">
                    <p className="text-sm">Order Number</p>
                    <p className="text-2xl font-bold">{currentPrintOrder.orderNumber.split('-')[1]}</p>
                  </div>
                </div>

                <div className="text-sm mb-1 border-b border-dashed border-black pb-1">
               {currentPrintOrder.customerName !== "Guest" &&   <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">{currentPrintOrder.customerName}</span>
                  </div>}
                  {currentPrintOrder.phoneNumber && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{currentPrintOrder.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{new Date(currentPrintOrder.orderDate || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-bold">{currentPrintOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                </div>

                <div className="mb-1">
                  <p className="font-bold text-sm">ORDER SUMMARY:</p>
                  {currentPrintOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₨{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-sm border-t-2 border-black pt-1 mb-1">
                  <div className="flex justify-between font-bold text-base">
                    <span>TOTAL:</span>
                    <span>₨{currentPrintOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-[11px] border-t border-dashed border-black pt-1">
                  <p className="font-bold">Preparing... Thanks for your patience!</p>
              
                </div>
               <div className="pt-1 border-t text-center border-black">
                    <p className="text-[15px] font-medium">
                      Software By: M.Ammar Shaikh
                    </p>
                    <p className="text-[13px] font-[400] break-all">
                      Tel: 0316-0346330 | 0370-2741544
                    </p>
                  </div>
              </div>
            </div>
          )}

          {/* Final Bill - Customer Receipt */}
          {printType === 'bill' && (
            <div className="hidden print:block print-content">
              <div className="receipt-container">
                <div className="text-center mb-1 border-b-2 border-dashed border-black pb-1">
                  <h1 className="text-2xl font-bold uppercase">{restaurantSettings?.restaurantName || 'RESTAURANT'}</h1>
                  <p className="text-xs">{restaurantSettings?.address || ''}</p>
                  <p className="text-xs"> {restaurantSettings?.phone1 || ''}{restaurantSettings?.phone2 ? ` | ${restaurantSettings.phone2}` : ''}</p>
                  <p className="text-xs text-center font-bold">BILL RECEIPT</p>
                </div>

                <div className="text-xs mb-1 border-b border-dashed border-black pb-1">
                  <div className="flex justify-between">
                    <span>Invoice#:</span>
                    <span className="font-bold">{currentPrintOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(currentPrintOrder.orderDate || new Date()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-bold uppercase">{currentPrintOrder.orderType}</span>
                  </div>
                  {currentPrintOrder.orderType === 'dine-in' && currentPrintOrder.tableNumber && (
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span className="font-bold">{currentPrintOrder.tableNumber}</span>
                    </div>
                  )}
                  {currentPrintOrder.customerName!=="Guest" && (
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{currentPrintOrder.customerName}</span>
                    </div>
                  )}
                  {currentPrintOrder.phoneNumber && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{currentPrintOrder.phoneNumber}</span>
                    </div>
                  )}
                  {currentPrintOrder.address && (
                    <div>
                      <span>Address:</span>
                      <p className="text-xs">{currentPrintOrder.address}</p>
                    </div>
                  )}
               {currentPrintOrder.paymentMethod !== "cash" &&   <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-bold">{currentPrintOrder.paymentMethod}</span>
                  </div>}
                </div>

                <div className="text-xs mb-1">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="text-left">Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPrintOrder.items.map((item, index) => (
                        <tr key={index} className="border-b border-dashed border-gray-300">
                          <td className="text-xs">{item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">{item.price}</td>
                          <td className="text-right font-bold">
                            {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs mb-1 border-t-2 border-black pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₨{currentPrintOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {currentPrintOrder.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charges ({currentPrintOrder.taxPercentage}%):</span>
                      <span>₨{currentPrintOrder.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {currentPrintOrder.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Charges:</span>
                      <span>₨{currentPrintOrder.deliveryCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {currentPrintOrder.discountPercentage > 0 && (
                    <div className="flex justify-between">
                      <span>Discount ({currentPrintOrder.discountPercentage}%):</span>
                      <span>-₨{currentPrintOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t border-black pt-1">
                    <span>TOTAL:</span>
                    <span>₨{currentPrintOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-xs border-t border-dashed border-black pt-1">
                  <p className="font-bold">{restaurantSettings?.footerMessage || 'Thank You for Dining with Us!'}</p>
            
                  <p className="text-[10px]">Print Time:{new Date().toLocaleString()}</p>
                 <div className="pt-1 border-t text-center border-black">
                    <p className="text-[15px] font-medium">
                      Software By: M.Ammar Shaikh
                    </p>
                    <p className="text-[13px] font-[400] break-all">
                      Tel: 0316-0346330 | 0370-2741544
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Print Styles */}
      <style jsx global>{`
  @media print {
          /* Hide everything first */
          body * {
            visibility: hidden;
          }
          
          /* Only show print content */
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          /* Position print content at top left */
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 66mm;
          }
          
          /* Receipt container styling */
          .receipt-container {
            width: 66mm;
            max-width: 70mm;
            margin: 0;
            padding: 2mm 2mm;
            padding-right:2mm
            font-family: 'Courier New', monospace;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          
          /* Hide non-print elements */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Page setup */
          @page {
            size: 66mm auto;
            margin: 0;
          }
          
          /* Remove any shadows, borders that shouldn't print */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}