  'use client'

  import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  CheckSquare, Square,
    AlertCircle,
    Tag,
    Receipt,
    Coffee,
    Phone,

    Hash,
    User,
    DollarSign,
    Percent,

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


    
    CheckCircle,

    MapPin,

    Package,
    


    Filter,
    ArrowBigDown,
    ArrowDown
  } from 'lucide-react'

  // Import server actions
  import { getCategories } from '@/lib/actions/categories'
  import { getActiveMenuItems } from '@/lib/actions/menuItems'
  import { createOrder, getPendingOrders, completeOrder } from '@/lib/actions/orders'
  import { getSettings  , togglePrintCustomerTicket} from '@/lib/actions/settings'
  import { searchCustomers as searchCustomersAPI } from '@/lib/actions/customers'
  import { updateOrderItems, reprintKOT } from '@/lib/actions/orders'
  import { Edit, Printer } from 'lucide-react'
  import { Users } from 'lucide-react'
  import { cancelOrder } from '@/lib/actions/orders'
  import { toggleMenuItemPin } from '@/lib/actions/menuItems'
  import { getKitchens } from '@/lib/actions/kitchens'
import { toggleSplitKOTByKitchen } from '@/lib/actions/settings'
  import { Pin } from 'lucide-react'

  const ORDER_TYPES = [
    { value: 'dine-in', label: 'Dine In', icon: UtensilsCrossed, color: 'from-blue-500 to-cyan-500' },
    { value: 'takeaway', label: 'Takeaway', icon: Package, color: 'from-purple-500 to-pink-500' },
    { value: 'delivery', label: 'Delivery', icon: Truck, color: 'from-orange-500 to-red-500' },
  ]

  const PAYMENT_METHODS = ['Cash', 'Card', 'Online', 'Other']
  // Memoized Menu Item Component
const MenuItem = React.memo(({ item, index, onAdd, onTogglePin }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className="relative group"
    >
      {/* Pin Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin(item._id, item.isPinned)
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`absolute top-1 right-1 z-20 p-1.5 sm:p-2 rounded-lg shadow-lg transition-all ${
          item.isPinned
            ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
            : 'bg-white/90 text-slate-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Pin className={`w-3 h-3 sm:w-4 sm:h-4 ${item.isPinned ? 'fill-current' : ''}`} />
      </motion.button>

      {/* Pinned Badge */}
      {item.isPinned && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -left-1 z-10"
        >
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-0.5">
            <Pin className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current" />
            <span>PINNED</span>
          </div>
        </motion.div>
      )}

      {/* Main Item Card */}
      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onAdd(item)}
        className="w-full bg-gradient-to-br from-white to-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border-2 border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all h-fit"
      >
        {/* Popular Badge */}
        {!item.isPinned && item.salesCount > 0 && index < 5 && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: index * 0.05 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <div className="relative">
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <span className="animate-pulse">🔥</span>
                <span>HOT</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-md opacity-40 -z-10"></div>
            </div>
          </motion.div>
        )}
        
        <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
          {item.categoryId?.icon || '🍽️'}
        </div>
        
        <h3 className="font-bold text-slate-800 text-xs sm:text-sm mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2 mb-2 min-h-[2rem] leading-tight">
            {item.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-500 truncate">{item.categoryId?.name}</span>
          {item.salesCount > 0 && !item.isPinned && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full"
            >
              {item.salesCount}
            </motion.span>
          )}
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
    </motion.div>
  )
})

// ✅ Set display name for better debugging
MenuItem.displayName = 'MenuItem'

  export default function POSPage() {
  // Data states
const [categories, setCategories] = useState([])
const [menuItems, setMenuItems] = useState([])
const [pendingOrders, setPendingOrders] = useState([])
const [kitchensCache, setKitchensCache] = useState([]) // ✅ NEW: Cache kitchens for fast access
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
    // Completion confirmation state
  const [completionConfirmation, setCompletionConfirmation] = useState(null)
  const [completionDetails, setCompletionDetails] = useState({
    paymentMethod: 'Cash',
    discountPercentage: 0,
    discountAmount: 0,
    deliveryCharge: 0,
    taxPercentage: 0,
    notes: ''
  })
  const [isPrintEnabled, setIsPrintEnabled] = useState(true);
  const [isSplitKOTEnabled, setIsSplitKOTEnabled] = useState(false)

    
    // Loading states
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(true)
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
    const [isLoadingPendingOrders, setIsLoadingPendingOrders] = useState(false)
    const [restaurantSettings, setRestaurantSettings] = useState(null)
    const [isCancellingOrder, setIsCancellingOrder] = useState(false) 
  // Edit order states - REPLACE your existing edit states with these
  const [editingOrder, setEditingOrder] = useState(null)
  const [editCart, setEditCart] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [selectedKOTItems, setSelectedKOTItems] = useState([])

  const [cancelConfirmation, setCancelConfirmation] = useState(null)
  // Quick quantity input states
  // ✅ ADD THESE NEW STATES FOR EDIT MODAL QUANTITY INPUT
  const [editQuickQuantity, setEditQuickQuantity] = useState(0)
  const [selectedEditItemForQuantity, setSelectedEditItemForQuantity] = useState(null)
  const editQuantityInputRef = useRef(null)
  // Quick quantity input states
  const [quickQuantity, setQuickQuantity] = useState(0)
  const [selectedItemForQuantity, setSelectedItemForQuantity] = useState(null)
  const quantityInputRef = useRef(null)
  // NEW: Add these for edit modal functionality
  const [editSearchQuery, setEditSearchQuery] = useState('')
  const [editSelectedCategory, setEditSelectedCategory] = useState('All')
  const [editSearchResults, setEditSearchResults] = useState([])
  const [showEditSearchDropdown, setShowEditSearchDropdown] = useState(false)
  const [selectedEditSearchIndex, setSelectedEditSearchIndex] = useState(-1)
  const editSearchInputRef = useRef(null)
  const editSearchDropdownRef = useRef(null)
  // Pending orders filters
  const [pendingOrdersSearch, setPendingOrdersSearch] = useState('')
  const [pendingOrderTypeFilter, setPendingOrderTypeFilter] = useState('all')
  //costumer search states
  // Customer search states - SEPARATE for name and phone
  const [customerSearchResults, setCustomerSearchResults] = useState([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1)
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const customerSearchRef = useRef(null)
  const customerDropdownRef = useRef(null)
  const [orderDetails, setOrderDetails] = useState({
      orderType: 'dine-in',
      tableNumber: '',
      paymentMethod: 'Cash',
      customerName: '',
      phoneNumber: '',
      address: '',
      discountPercentage: 0,
      discountAmount: 0,  // ADD THIS NEW FIELD
      deliveryCharge: 0,
      taxPercentage: 0,
      notes: '',
    })


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
      // Show notification
    const showNotification = (message, type = 'success') => {
      setNotification({ message, type })
      setTimeout(() => setNotification(null), 3000)
    }

    // Add after your existing state declarations (around line 45)
  const [pinnedItems, setPinnedItems] = useState([])
  // Optimized customer search with proper debounce
  useEffect(() => {
    const performSearch = async () => {
      // Get search term from either name or phone field
      const nameQuery = orderDetails.customerName?.trim() || ''
      const phoneQuery = orderDetails.phoneNumber?.trim() || ''
      
      // Use whichever field has more characters
      const searchTerm = nameQuery.length >= phoneQuery.length ? nameQuery : phoneQuery
      
      // Don't search if query is too short
      if (searchTerm.length < 2) {
        setCustomerSearchResults([])
        setShowCustomerDropdown(false)
        return
      }

      setSearchingCustomers(true)
      try {
        const response = await searchCustomersAPI(searchTerm)
        if (response.success) {
          setCustomerSearchResults(response.data)
          setShowCustomerDropdown(response.data.length > 0)
          setSelectedCustomerIndex(-1)
        }
      } catch (error) {
        console.error('Error searching customers:', error)
        setCustomerSearchResults([])
        setShowCustomerDropdown(false)
      } finally {
        setSearchingCustomers(false)
      }
    }

    // Debounce search - wait 400ms after user stops typing
  // You already have this, but make sure timeout is 300ms max
  const debounceTimer = setTimeout(performSearch, 300) // Not 400ms
    
    return () => clearTimeout(debounceTimer)
  }, [orderDetails.customerName, orderDetails.phoneNumber]) // Watch BOTH fields

  // ===== REPLACE handleCustomerSelect =====
const printCustomerToggle = async (enable) => {
  try {
    const response = await togglePrintCustomerTicket(enable);
    if (response.success) {
      setIsPrintEnabled(response.data.printCustomerTicket);
      showNotification(response.message, 'success');
    } else {
      showNotification(response.error, 'error');
    }
  } catch (error) {
    showNotification('Failed to update print settings', 'error');
    console.error('Error:', error);
  }
}
const splitKOTToggle = async (enable) => {
  try {
    const response = await toggleSplitKOTByKitchen(enable)
    if (response.success) {
      setIsSplitKOTEnabled(response.data.splitKOTByKitchen)
      showNotification(response.message, 'success')
    } else {
      showNotification(response.error, 'error')
    }
  } catch (error) {
    showNotification('Failed to update split KOT settings', 'error')
    console.error('Error:', error)
  }
}


const handleCustomerSelect = (customer) => {
    // Fill all order details with customer data
    setOrderDetails(prev => ({
      ...prev,
      customerName: customer.name,
      phoneNumber: customer.phoneNumber,
      address: customer.address || '',
    }))
    
    // Clear search state
    setShowCustomerDropdown(false)
    setCustomerSearchResults([])
    setSelectedCustomerIndex(-1)
    
    // Show success notification
    showNotification(`Customer ${customer.name} selected`, 'success')
  }

  // ===== REPLACE handleCustomerKeyDown =====

  const handleCustomerKeyDown = (e) => {
    if (!showCustomerDropdown || customerSearchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedCustomerIndex(prev => 
          prev < customerSearchResults.length - 1 ? prev + 1 : prev
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedCustomerIndex >= 0 && customerSearchResults[selectedCustomerIndex]) {
          handleCustomerSelect(customerSearchResults[selectedCustomerIndex])
        }
        break
      
      case 'Escape':
        e.preventDefault()
        setShowCustomerDropdown(false)
        setSelectedCustomerIndex(-1)
        break
    }
  }


  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target) &&
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false)
        setSelectedCustomerIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  // Reset when modal closes
  useEffect(() => {
    if (!isOrderModalOpen) {
      setCustomerSearchResults([])
      setShowCustomerDropdown(false)
      setSelectedCustomerIndex(-1)
    }
  }, [isOrderModalOpen])

  // Clear when switching to dine-in
  useEffect(() => {
    if (orderDetails.orderType === 'dine-in') {
      setCustomerSearchResults([])
      setShowCustomerDropdown(false)
      setSelectedCustomerIndex(-1)
    }
  }, [orderDetails.orderType])



    
    // Order details


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
  loadKitchensCache() // ✅ Load kitchens ONCE on mount
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
    const response = await getActiveMenuItems({ 
      limit: 50,
      category: selectedCategory 
    })
    if (response.success) {
      const items = response.data
      
      // ✅ FIXED: Use console.log
      console.log('📋 Loaded items with kitchens:', items.slice(0, 3))
      
      // Separate pinned and unpinned items
      const pinned = items.filter(item => item.isPinned)
      const unpinned = items.filter(item => !item.isPinned)
      
      // Sort pinned items by pinnedAt date (most recent first)
      pinned.sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt))
      
      setPinnedItems(pinned)
      setMenuItems(items) // Keep all items for search
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

  // Add this function after loadMenuItems
  const handleTogglePin = useCallback(async (menuItemId, currentPinStatus) => {
    try {
      const response = await toggleMenuItemPin(menuItemId)
      if (response.success) {
        await loadMenuItems()
        showNotification(
          currentPinStatus ? 'Item unpinned' : 'Item pinned to top', 
          'success'
        )
      } else {
        showNotification('Failed to update pin status', 'error')
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
      showNotification('Failed to update pin status', 'error')
    }
  }, [loadMenuItems, showNotification])

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
// Load settings function (in component)
const loadRestaurantSettings = async () => {
  try {
    const response = await getSettings()
    if (response.success) {
      setIsPrintEnabled(response.data.printCustomerTicket)
      setIsSplitKOTEnabled(response.data.splitKOTByKitchen) // ✅ Keep this
      setRestaurantSettings(response.data)
      setOrderDetails(prev => ({
        ...prev,
        taxPercentage: response.data.taxPercentage || 0, 
      }))
    }
  } catch (error) {
    console.error('Error loading restaurant settings:', error)
  }
}
// Load kitchens ONCE and cache them
const loadKitchensCache = async () => {
  try {
    const response = await getKitchens()
    if (response.success) {
      // Store ONLY active kitchens for fast lookup
      const activeKitchens = response.data.filter(k => k.isActive)
      setKitchensCache(activeKitchens)  // ✅ This should work now
      console.log('✅ Kitchens cached:', activeKitchens.length)
    }
  } catch (error) {
    console.error('Error loading kitchens cache:', error)
  }
}
    // Auto-update delivery charge based on order type
  // Auto-update delivery charge and tax based on order type
  useEffect(() => {
    if (orderDetails.orderType === 'delivery' && orderDetails.deliveryCharge === 0) {
      setOrderDetails(prev => ({ ...prev, deliveryCharge: restaurantSettings?.deliveryCharges || 0 }))
    } else if (orderDetails.orderType !== 'delivery') {
      setOrderDetails(prev => ({ ...prev, deliveryCharge: 0 }))
    }
    
    if (orderDetails.orderType === 'dine-in') {
      setOrderDetails(prev => ({ ...prev, taxPercentage: restaurantSettings?.taxPercentage || 0 }))
    } else {
      setOrderDetails(prev => ({ ...prev, taxPercentage: 0 }))
    }
  }, [orderDetails.orderType, restaurantSettings?.taxPercentage, restaurantSettings?.deliveryCharges])
    // Calculations
    const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
    [cart]
  )
    const tax = subtotal * (orderDetails.taxPercentage / 100)
  // Smart discount calculation - works with both percentage and amount
  let discountAmount = 0
  if (orderDetails.discountPercentage > 0) {
    // If percentage is set, calculate amount
    discountAmount = (subtotal * orderDetails.discountPercentage) / 100
  } else if (orderDetails.discountAmount > 0) {
    // If amount is set, use it directly
    discountAmount = orderDetails.discountAmount
  }
    const total = subtotal + tax - discountAmount + orderDetails.deliveryCharge


    // Helper function to update discount percentage and sync amount
  const updateDiscountPercentage = (percentage) => {
    const percent = parseFloat(percentage) || 0
    const amount = (subtotal * percent) / 100
    
    setOrderDetails(prev => ({
      ...prev,
      discountPercentage: percent,
      discountAmount: amount
    }))
  }

  // Helper function to update discount amount and sync percentage
  const updateDiscountAmount = (amount) => {
    const amt = parseFloat(amount) || 0
    const percent = subtotal > 0 ? (amt / subtotal) * 100 : 0
    
    setOrderDetails(prev => ({
      ...prev,
      discountAmount: amt,
      discountPercentage: Math.min(percent, 100) // Cap at 100%
    }))
  }

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
        handleItemSelectForQuantity(searchResults[selectedSearchIndex]) // NEW
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
  // Replace your existing filteredProducts logic (around line 280)
  const filteredProducts = useMemo(() => {
    const categoryFiltered = menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || 
        (item.categoryId && item.categoryId.name === selectedCategory)
      return matchesCategory
    })

    const pinned = categoryFiltered.filter(item => item.isPinned)
    const unpinned = categoryFiltered.filter(item => !item.isPinned)
    
    pinned.sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt))
    
    return [...pinned, ...unpinned]
  }, [menuItems, selectedCategory])



    // Cart operations
  // Enhanced add to cart with quantity support
  // Enhanced add to cart with quantity support
  const addToCartWithQuantity = (menuItem, quantity = 1) => {
    const existingItem = cart.find((item) => item._id === menuItem._id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === menuItem._id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        )
      )
      showNotification(`${menuItem.name} +${quantity} (Total: ${existingItem.quantity + quantity})`, 'success')
    } else {
      setCart([...cart, { ...menuItem, quantity }])
      showNotification(`${menuItem.name} x${quantity} added`, 'success')
    }
    
    // Reset and focus back to search
    setQuickQuantity(0)
    setSelectedItemForQuantity(null)
    setSearchQuery('')
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  // Handle item selection - move focus to quantity
  const handleItemSelectForQuantity = (item) => {
    setSelectedItemForQuantity(item)
    setSearchQuery('')
    setShowSearchDropdown(false)
    setTimeout(() => quantityInputRef.current?.focus(), 100)
  }

  // Handle quantity confirmation
  const handleQuantityConfirm = () => {
    if (selectedItemForQuantity && quickQuantity > 0) {
      addToCartWithQuantity(selectedItemForQuantity, quickQuantity)
    }
  }

  // Handle quantity input key press
  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuantityConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSelectedItemForQuantity(null)
      setQuickQuantity(0)
      searchInputRef.current?.focus()
    }
  }
  // Keep original addToCart for backward compatibility
const addToCart = (menuItem) => addToCartWithQuantity(menuItem, 1)
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
  if (currentDetails.orderType === 'delivery') {
    if (!currentDetails.customerName.trim() || !currentDetails.phoneNumber.trim() || !currentDetails.address.trim()) {
      showNotification('Please fill all delivery details', 'error')
      return
    }
  }

  setIsSubmittingOrder(true)

  try {
    // ✅ STEP 1: PREPARE ORDER DATA
    const orderData = {
      items: cart.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.sellingPrice,
        quantity: item.quantity,
        categoryId: item.categoryId,
        // ✅ FIX: Extract kitchen ID properly (handle both ObjectId and populated object)
        kitchenId: item.kitchenId?._id?.toString() || item.kitchenId?.toString() || null,
        icon: item.categoryId?.icon || '🍽️'
      })),
      orderType: currentDetails.orderType,
      subtotal,
      tax,
      taxPercentage: currentDetails.taxPercentage,
      discount: discountAmount,
      discountPercentage: currentDetails.discountPercentage,
      discountAmount: currentDetails.discountAmount,
      deliveryCharge: currentDetails.deliveryCharge,
      total,
      paymentMethod: currentDetails.paymentMethod,
      customerName: currentDetails.customerName || 'Guest',
      phoneNumber: currentDetails.phoneNumber || null,
      tableNumber: currentDetails.tableNumber || null,
      address: currentDetails.address || null,
      notes: currentDetails.notes || null
    }

    // ✅ DEBUG: Log cart items to see kitchen data
console.log('🛒 Cart items:', cart.map(item => ({
      name: item.name,
      kitchen: item.kitchenId
    })))

    // ✅ STEP 2: GENERATE TEMPORARY ORDER NUMBER
const tempOrderNumber = `TEMP-${Date.now().toString().slice(-5)}`
// Example: TEMP-45678
// Example: TEMP-12345678

    // ✅ STEP 3: PRINT KOTs BY KITCHEN
    if (isSplitKOTEnabled && kitchensCache.length > 0) {
      ('🍳 Split KOT is ENABLED, grouping by kitchen...')
      
      // Group items by kitchen
      const kitchenGroups = {}
      
      cart.forEach((cartItem, index) => {
        const orderItem = orderData.items[index]
        
        // Get kitchen from cart item (which has populated data)
        const kitchen = cartItem.kitchenId
        let kitchenId = 'unassigned'
        let kitchenData = null
        
        if (kitchen) {
          // Handle both populated object and ObjectId
          if (typeof kitchen === 'object' && kitchen._id) {
            // Populated kitchen object
            kitchenId = kitchen._id.toString()
            kitchenData = kitchen
          } else if (typeof kitchen === 'string') {
            // ObjectId string
            kitchenId = kitchen
            kitchenData = kitchensCache.find(k => k._id.toString() === kitchen)
          }
        }
        
        // Create group if doesn't exist
        if (!kitchenGroups[kitchenId]) {
          kitchenGroups[kitchenId] = {
            kitchen: kitchenData || { 
              name: 'General Kitchen', 
              color: '#10b981', 
              icon: '🍳' 
            },
            items: []
          }
        }
        
        kitchenGroups[kitchenId].items.push(orderItem)
      })
      
      ('📦 Kitchen groups created:', Object.keys(kitchenGroups).length)
      Object.entries(kitchenGroups).forEach(([id, group]) => {
        (`  - ${group.kitchen.name}: ${group.items.length} items`)
      })
      
      // Print KOTs for each kitchen
      const kitchenIds = Object.keys(kitchenGroups)
      
      for (let i = 0; i < kitchenIds.length; i++) {
        const kitchenId = kitchenIds[i]
        const group = kitchenGroups[kitchenId]
        
        (`🖨️ Printing KOT ${i + 1}/${kitchenIds.length} for ${group.kitchen.name}`)
        
        const kotOrder = {
          ...orderData,
          orderNumber: tempOrderNumber,
          orderDate: new Date(),
          items: group.items,
          kitchenName: group.kitchen.name,
          kitchenColor: group.kitchen.color,
          kitchenIcon: group.kitchen.icon
        }
        
        setCurrentPrintOrder(kotOrder)
        setPrintType('kot')
        
        // Print
        await new Promise(resolve => {
          setTimeout(() => {
            window.print()
            resolve()
          }, 100)
        })
        
        // Delay between prints
        if (i < kitchenIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    } else {
      ('🍳 Split KOT is DISABLED, printing single KOT')
      
      // Single KOT
      const kotOrder = {
        ...orderData,
        orderNumber: tempOrderNumber,
        orderDate: new Date()
      }
      
      setCurrentPrintOrder(kotOrder)
      setPrintType('kot')
      
      await new Promise(resolve => {
        setTimeout(() => {
          window.print()
          resolve()
        }, 100)
      })
    }

    // ✅ STEP 4: CREATE ORDER IN DATABASE
    const response = await createOrder(orderData)

    if (response.success) {
      ('✅ Order created:', response.data.orderNumber)
      
      setIsOrderModalOpen(false)
      
      if (currentDetails.orderType === 'takeaway' && isPrintEnabled) {
        setTimeout(() => {
          setCurrentPrintOrder(response.data)
          setPrintType('customer-ticket')
          setTimeout(() => {
            window.print()
            finalizePendingOrder(response.data)
          }, 100)
        }, 500)
      } else {
        finalizePendingOrder(response.data)
      }
    } else {
      showNotification(response.error || 'Failed to create order', 'error')
    }
  } catch (error) {
    showNotification('Error creating order', 'error')
    console.error('❌ Order creation error:', error)
  } finally {
    setIsSubmittingOrder(false)
  }
}



  // Handle quantity input key press

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
    discountAmount: 0,  // ADD THIS
    deliveryCharge: 0,
    taxPercentage: restaurantSettings?.taxPercentage || 0,
    notes: '',
  })
    setPrintType(null)
    setCurrentPrintOrder(null)
    showNotification('Order sent to kitchen!', 'success')
  }

  const confirmCompleteOrder = async () => {
    if (!completionConfirmation) return
    
    try {
      // Calculate updated totals
      const subtotal = completionConfirmation.items.reduce(
        (sum, item) => sum + item.price * item.quantity, 
        0
      )
      const tax = subtotal * (completionDetails.taxPercentage / 100)
      
      // Calculate discount - use whichever was set
      let discountAmount = 0
      if (completionDetails.discountPercentage > 0) {
        discountAmount = (subtotal * completionDetails.discountPercentage) / 100
      } else if (completionDetails.discountAmount > 0) {
        discountAmount = completionDetails.discountAmount
      }
      
      const total = subtotal + tax - discountAmount + completionDetails.deliveryCharge

      // ✅ FIXED: Create updated order object with ALL new details
      const updatedOrder = {
        ...completionConfirmation,
        paymentMethod: completionDetails.paymentMethod,
        discountPercentage: completionDetails.discountPercentage,
        discountAmount: discountAmount,
        discount: discountAmount,
        deliveryCharge: completionDetails.deliveryCharge,
        taxPercentage: completionDetails.taxPercentage,
        tax: tax,
        subtotal: subtotal,
        total: total,
        notes: completionDetails.notes,
        status: 'completed'
      }

      // Set for printing FIRST
      setCurrentPrintOrder(updatedOrder)
      setPrintType('bill')
      setCompletionConfirmation(null)
      
      // Print the bill
      setTimeout(async () => {
        window.print()
        
        // ✅ AFTER printing, update the order in database with new details
        setTimeout(async () => {
          const response = await completeOrder(
            completionConfirmation._id,
            {
              paymentMethod: completionDetails.paymentMethod,
              taxPercentage: completionDetails.taxPercentage,
              tax: tax,
              discountPercentage: completionDetails.discountPercentage,
              discountAmount: discountAmount,
              discount: discountAmount,
              deliveryCharge: completionDetails.deliveryCharge,
              subtotal: subtotal,
              total: total,
              notes: completionDetails.notes
            }
          )
          
          if (response.success) {
            await loadPendingOrders()
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

  // Helper function to update discount percentage in completion
  const updateCompletionDiscountPercentage = (percentage) => {
    const order = completionConfirmation
    if (!order) return
    
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    )
    
    const percent = parseFloat(percentage) || 0
    const amount = (subtotal * percent) / 100
    
    setCompletionDetails(prev => ({
      ...prev,
      discountPercentage: percent,
      discountAmount: amount
    }))
  }

  // Helper function to update discount amount in completion
  const updateCompletionDiscountAmount = (amount) => {
    const order = completionConfirmation
    if (!order) return
    
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    )
    
    const amt = parseFloat(amount) || 0
    const percent = subtotal > 0 ? (amt / subtotal) * 100 : 0
    
    setCompletionDetails(prev => ({
      ...prev,
      discountAmount: amt,
      discountPercentage: Math.min(percent, 100)
    }))
  }


  const completeOrderHandler = async (orderId) => {
    try {
      const order = pendingOrders.find(o => o._id === orderId)
      if (!order) return

      // Show confirmation modal with pre-filled details
      setCompletionDetails({
        paymentMethod: order.paymentMethod || 'Cash',
        discountPercentage: order.discountPercentage || 0,
        discountAmount: order.discountAmount || 0,
        deliveryCharge: order.deliveryCharge || 0,
        taxPercentage: order.taxPercentage || 0,
        notes: order.notes || ''
      })
      setCompletionConfirmation(order)
      
    } catch (error) {
      showNotification('Error loading order details', 'error')
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
  // Start editing an order
  const startEditingOrder = (order) => {
    setEditingOrder(order)
    setEditCart(order.items.map(item => ({
      _id: item.menuItemId,
      name: item.name,
      sellingPrice: item.price,
      costPrice: item.costPrice,
      quantity: item.quantity,
      categoryId: { 
        name: item.category,
        icon: item.icon 
      }
    })))
    setEditSearchQuery('')
    setEditSelectedCategory('All')
    setSelectedKOTItems([]) // START WITH EMPTY - USER SELECTS MANUALLY
    setIsEditModalOpen(true)
    setIsPendingOrdersOpen(false)
  }
  // Toggle individual item for KOT
  const toggleKOTItem = (itemId) => {
    setSelectedKOTItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  // Toggle all items for KOT
  const toggleAllKOTItems = () => {
    if (selectedKOTItems.length === editCart.length) {
      setSelectedKOTItems([])
    } else {
      setSelectedKOTItems(editCart.map(item => item._id))
    }
  }

  // Print KOT for selected items only
  const handlePrintSelectedKOT = async () => {
    if (selectedKOTItems.length === 0) {
      showNotification('Please select at least one item for KOT', 'error')
      return
    }

    try {
      const selectedItems = editCart.filter(item => 
        selectedKOTItems.includes(item._id)
      )

      const kotOrder = {
        ...editingOrder,
        items: selectedItems.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.sellingPrice,
          quantity: item.quantity,
          icon: item.categoryId?.icon || '🍽️'
        }))
      }

      setCurrentPrintOrder(kotOrder)
      setPrintType('kot')
      
      setTimeout(() => {
        window.print()
        setPrintType(null)
        setCurrentPrintOrder(null)
        showNotification(`KOT printed for ${selectedKOTItems.length} item(s)!`, 'success')
      }, 100)
      
    } catch (error) {
      console.error('Error printing KOT:', error)
      showNotification('Failed to print KOT', 'error')
    }
  }
  // ✅ ENHANCED: Add to edit cart with quantity support
  const addToEditCartWithQuantity = (menuItem, quantity = 1) => {
    const existingItem = editCart.find((item) => item._id === menuItem._id)
    if (existingItem) {
      setEditCart(
        editCart.map((item) =>
          item._id === menuItem._id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        )
      )
      showNotification(`${menuItem.name} +${quantity} (Total: ${existingItem.quantity + quantity})`, 'success')
    } else {
    setEditCart([{ ...menuItem, quantity }, ...editCart])
      showNotification(`${menuItem.name} x${quantity} added`, 'success')
    }
    
    // Reset and focus back to search
    setEditQuickQuantity(0)
    setSelectedEditItemForQuantity(null)
    setEditSearchQuery('')
    setTimeout(() => editSearchInputRef.current?.focus(), 100)
  }

  // ✅ Handle item selection for quantity
  const handleEditItemSelectForQuantity = (item) => {
    setSelectedEditItemForQuantity(item)
    setEditSearchQuery('')
    setShowEditSearchDropdown(false)
    setTimeout(() => editQuantityInputRef.current?.focus(), 100)
  }

  // ✅ Handle quantity confirmation
  const handleEditQuantityConfirm = () => {
    if (selectedEditItemForQuantity && editQuickQuantity > 0) {
      addToEditCartWithQuantity(selectedEditItemForQuantity, editQuickQuantity)
    }
  }

  // ✅ Handle quantity input key press
  const handleEditQuantityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEditQuantityConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSelectedEditItemForQuantity(null)
      setEditQuickQuantity(0)
      editSearchInputRef.current?.focus()
    }
  }

  // Keep original addToEditCart for backward compatibility (clicking items)
  const addToEditCart = (menuItem) => {
    addToEditCartWithQuantity(menuItem, 1)
    // Don't auto-select - let user choose
  }
  // ADD this function for filtering edit products
  const getEditFilteredProducts = () => {
    return menuItems.filter((item) => {
      const matchesCategory = editSelectedCategory === 'All' || 
        (item.categoryId && item.categoryId.name === editSelectedCategory)
      return matchesCategory
    })
  }

  // Save edited order
  const saveEditedOrder = async () => {
    if (editCart.length === 0) {
      showNotification('Cart cannot be empty', 'error')
      return
    }

    setIsSavingEdit(true)
    try {
      const updatedItems = editCart.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.sellingPrice,
        quantity: item.quantity
      }))

      const response = await updateOrderItems(editingOrder._id, updatedItems)
      
      if (response.success) {
        showNotification('Order updated successfully!', 'success')
        setIsEditModalOpen(false)
        setEditingOrder(null)
        setEditCart([])
        setIsPendingOrdersOpen(true)
        await loadPendingOrders()
      } else {
        showNotification(response.error || 'Failed to update order', 'error')
      }
    } catch (error) {
      console.error('Error saving edited order:', error)
      showNotification('Error updating order', 'error')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Reprint KOT
  const handleReprintKOT = async (order) => {
    try {
      const response = await reprintKOT(order._id)
      if (response.success) {
        setCurrentPrintOrder(response.data)
        setPrintType('kot')
        setTimeout(() => {
          window.print()
          setPrintType(null)
          setCurrentPrintOrder(null)
          showNotification('KOT reprinted!', 'success')
        }, 100)
      }
    } catch (error) {
      showNotification('Failed to reprint KOT', 'error')
    }
  }

  // Reprint Customer Token (for takeaway)
  const handleReprintToken = async (order) => {
    try {
      const response = await reprintKOT(order._id)
      if (response.success) {
        setCurrentPrintOrder(response.data)
        setPrintType('customer-ticket')
        setTimeout(() => {
          window.print()
          setPrintType(null)
          setCurrentPrintOrder(null)
          showNotification('Token reprinted!', 'success')
        }, 100)
      }
    } catch (error) {
      showNotification('Failed to reprint token', 'error')
    }
  }

  // Filter pending orders
  const filteredPendingOrders = pendingOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(pendingOrdersSearch.toLowerCase()) ||
      order.customerName.toLowerCase().includes(pendingOrdersSearch.toLowerCase()) ||
      (order.phoneNumber && order.phoneNumber.includes(pendingOrdersSearch)) ||
      (order.tableNumber && order.tableNumber.toLowerCase().includes(pendingOrdersSearch.toLowerCase()))
    
    const matchesType = pendingOrderTypeFilter === 'all' || order.orderType === pendingOrderTypeFilter
    
    return matchesSearch && matchesType
  })

  // Cancel order with confirmation
  const handleCancelOrder = (orderId, orderNumber) => {
    setCancelConfirmation({ orderId, orderNumber })
  }

  const confirmCancelOrder = async () => {
    if (!cancelConfirmation) return
    
    setIsCancellingOrder(true) // ✅ START LOADING
    
    try {
      const response = await cancelOrder(cancelConfirmation.orderId)
      
      if (response.success) {
        showNotification(`Order ${cancelConfirmation.orderNumber} cancelled`, 'success')
        await loadPendingOrders() // Refresh the list
        setCancelConfirmation(null)
      } else {
        showNotification(response.error || 'Failed to cancel order', 'error')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      showNotification('Error cancelling order', 'error')
    } finally {
      setIsCancellingOrder(false) // ✅ STOP LOADING
    }
  }
  // Edit Modal Search functionality
  useEffect(() => {
    if (editSearchQuery.trim().length > 0) {
      const filtered = menuItems.filter((item) =>
        item.name.toLowerCase().includes(editSearchQuery.toLowerCase())
      )
      setEditSearchResults(filtered)
      setShowEditSearchDropdown(true)
      setSelectedEditSearchIndex(-1)
    } else {
      setEditSearchResults([])
      setShowEditSearchDropdown(false)
      setSelectedEditSearchIndex(-1)
    }
  }, [editSearchQuery, menuItems])

  // Edit search keyboard navigation
  // Edit search keyboard navigation
  const handleEditSearchKeyDown = (e) => {
    if (!showEditSearchDropdown || editSearchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedEditSearchIndex((prev) => prev < editSearchResults.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedEditSearchIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedEditSearchIndex >= 0) {
        // ✅ CHANGED: Show quantity input instead of directly adding
        handleEditItemSelectForQuantity(editSearchResults[selectedEditSearchIndex])
      }
    } else if (e.key === 'Escape') {
      setShowEditSearchDropdown(false)
    }
  }

  // Click outside to close edit search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        editSearchDropdownRef.current &&
        !editSearchDropdownRef.current.contains(event.target) &&
        editSearchInputRef.current &&
        !editSearchInputRef.current.contains(event.target)
      ) {
        setShowEditSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  useEffect(() => {
    if (!isEditModalOpen) {
      setEditQuickQuantity(0)
      setSelectedEditItemForQuantity(null)
      setEditSearchQuery('')
      setShowEditSearchDropdown(false)
      setSelectedKOTItems([])
    }
  }, [isEditModalOpen])


      return (
      <>
        {/* Main UI */}
        <div className="print:hidden lg:mt-[-30px] max-h-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-2 sm:p-3 md:p-4 lg:p-6 ">
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
{/* Split KOT Toggle - ADD THIS */}
<motion.div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 shadow-md hover:shadow-lg ${
  isSplitKOTEnabled 
    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300' 
    : 'bg-white border-gray-200'
}`}>
  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
    isSplitKOTEnabled ? 'bg-purple-500' : 'bg-gray-300'
  }`}>
    <Grid3x3 size={16} className="text-white" />
  </div>
  <div className="flex flex-col">
    <span className="text-xs font-semibold text-gray-800">Split KOT by Kitchen</span>
    <span className="text-[10px] text-gray-500">
      {isSplitKOTEnabled ? 'Separate KOT per Kitchen' : 'Single KOT for All'}
    </span>
  </div>
  <button
    onClick={() => splitKOTToggle(!isSplitKOTEnabled)}
    className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out ml-2 ${
      isSplitKOTEnabled 
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
        : 'bg-gray-300'
    }`}
  >
    <div
      className={`absolute top-0.5 left-0.5 flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-lg transform transition-all duration-300 ease-in-out ${
        isSplitKOTEnabled ? 'translate-x-7' : 'translate-x-0'
      }`}
    >
      {isSplitKOTEnabled ? (
        <Check size={14} className="text-purple-500" strokeWidth={3} />
      ) : (
        <X size={14} className="text-gray-400" strokeWidth={3} />
      )}
    </div>
  </button>
</motion.div>
<motion.div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 shadow-md hover:shadow-lg ${
  isPrintEnabled 
    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300' 
    : 'bg-white border-gray-200'
}`}>
  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
    isPrintEnabled ? 'bg-emerald-500' : 'bg-gray-300'
  }`}>
    <Printer 
      size={16} 
      className="text-white"
    />
  </div>
  <div className="flex flex-col">
    <span className="text-xs font-semibold text-gray-800">Print Waiting Token</span>
    <span className="text-[10px] text-gray-500">
      {isPrintEnabled ? 'Waiting Token Will Print' : 'Waiting Token Will Not Print'}
    </span>
  </div>
  <button
    onClick={() => printCustomerToggle(!isPrintEnabled)}
    className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out ml-2 ${
      isPrintEnabled 
        ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/50' 
        : 'bg-gray-300'
    }`}
  >
    <div
      className={`absolute top-0.5 left-0.5 flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-lg transform transition-all duration-300 ease-in-out ${
        isPrintEnabled ? 'translate-x-7' : 'translate-x-0'
      }`}
    >
      {isPrintEnabled ? (
        <Check size={14} className="text-emerald-500" strokeWidth={3} />
      ) : (
        <X size={14} className="text-gray-400" strokeWidth={3} />
      )}
    </div>
  </button>
</motion.div>
         
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
            {/* Search & Quantity Input - Inline */}
  <div className="mb-3 sm:mb-4">
    <div className="flex gap-2 sm:gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
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
          disabled={selectedItemForQuantity !== null}
          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={() => handleItemSelectForQuantity(product)}
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

      {/* Quantity Input - Shows when item selected */}
      <AnimatePresence>
        {selectedItemForQuantity ? (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            {/* Item Preview Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-xl">
              <span className="text-2xl">{selectedItemForQuantity.categoryId?.icon || '🍽️'}</span>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate max-w-[100px]">
                  {selectedItemForQuantity.name}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold">
                  ₨{selectedItemForQuantity.sellingPrice}
                </p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1.5 bg-white border-2 border-emerald-500 rounded-xl p-1 shadow-lg">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuickQuantity(Math.max(1, quickQuantity - 1))}
                className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
              
              <input
                ref={quantityInputRef}
                type="number"
                value={quickQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  setQuickQuantity(Math.max(0, Math.min(999, val)))
                }}
                onKeyDown={handleQuantityKeyDown}
                min="0"
                max="999"
                className="w-12 sm:w-16 text-center text-lg sm:text-xl font-bold px-2 py-1 border-2 border-transparent focus:border-emerald-500 rounded-lg focus:outline-none bg-slate-50 transition-all"
              />
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuickQuantity(quickQuantity + 1)}
                className="p-1.5 sm:p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
            </div>

            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuantityConfirm}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </motion.button>

            {/* Cancel Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedItemForQuantity(null)
                setQuickQuantity(0)
                searchInputRef.current?.focus()
              }}
              className="p-2 sm:p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          // Placeholder when no item selected
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 sm:py-3 bg-slate-100 border-2 border-slate-200 rounded-xl"
          >
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium text-sm hidden sm:inline">
              Qty
            </span>
            <span className="text-slate-400 font-bold text-lg">-</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Selected Item Info Banner - Mobile Only */}
    <AnimatePresence>
      {selectedItemForQuantity && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="sm:hidden mt-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-lg flex items-center gap-2"
        >
          <span className="text-2xl">{selectedItemForQuantity.categoryId?.icon || '🍽️'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">
              {selectedItemForQuantity.name}
            </p>
            <p className="text-xs text-emerald-600">
              ₨{selectedItemForQuantity.sellingPrice} × {quickQuantity} = ₨{(selectedItemForQuantity.sellingPrice * quickQuantity).toFixed(2)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

                  {/* Categories */}
                  <div className="flex gap-2 overflow-x-auto pb-2  modern-scrollbar">
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
                {/* Add this BEFORE the menu items grid */}
  {filteredProducts.some(item => item.isPinned) && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 sm:mb-4 flex items-center gap-2 px-2"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg">
        <Pin className="w-4 h-4 text-yellow-600 fill-current" />
        <span className="text-sm font-bold text-yellow-700">
          Pinned Items ({filteredProducts.filter(i => i.isPinned).length})
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-yellow-300 to-transparent"></div>
    </motion.div>
  )}

                {/* Menu Items Grid */}
              <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100"
  >
    {isLoadingMenuItems ? (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    ) : filteredProducts.length === 0 ? (
      <div className="text-center h-[50vh] flex flex-col items-center justify-center">
        <Coffee className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mb-4" />
        <p className="text-slate-500 font-semibold text-base sm:text-lg">No items found</p>
        <p className="text-slate-400 text-xs sm:text-sm mt-2">
          Try selecting a different category
        </p>
      </div>
    ) : (
      <div className="h-[48vh] overflow-y-auto pt-3 modern-scrollbar pr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
  {filteredProducts.map((item, index) => (
    <MenuItem
      key={item._id}
      item={item}
      index={index}
      onAdd={addToCart}
      isPinned={item.isPinned}
      onTogglePin={handleTogglePin}
    />
  ))}
        </div>
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
                  <div className="p-3 sm:p-4 max-h-[350px] sm:max-h-[350px] overflow-y-auto mordern-scrollbar">
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
                  {(orderDetails.discountPercentage > 0 || orderDetails.discountAmount > 0) && (
    <div className="flex justify-between text-xs sm:text-sm text-emerald-600">
      <span className="font-medium">
        Discount 
        {orderDetails.discountPercentage > 0 && ` (${orderDetails.discountPercentage.toFixed(1)}%)`}:
      </span>
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
                  { keys: ['Enter', 'Qty', 'Enter'], action: 'Quick Add Item', desc: 'Search → Select → Enter quantity → Add' },
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
              {(orderDetails.discountPercentage > 0 || orderDetails.discountAmount > 0) && (
    <div className="flex justify-between text-emerald-600">
      <span>
        Discount 
        {orderDetails.discountPercentage > 0 && ` (${orderDetails.discountPercentage.toFixed(1)}%)`}:
      </span>
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
                        Table Number * (Optional if not assigned)
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

              {/* Replace the Customer Name input section in your Order Modal with this */}

  {/* REPLACE YOUR CUSTOMER INPUT SECTION WITH THIS */}

  {(orderDetails.orderType === 'takeaway' || orderDetails.orderType === 'delivery') && (
    <>
      {/* Customer Name with Smart Search */}
      <div className="relative">
        <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          Customer Name {orderDetails.orderType === 'delivery' && '*'}
        </label>
        
        <div className="relative">
          <input
            ref={customerSearchRef}
            type="text"
            autoFocus={orderDetails.orderType === 'takeaway' || orderDetails.orderType === 'delivery'}
            value={orderDetails.customerName}
            onChange={(e) => {
              const value = e.target.value
              // ONLY update customer name
              setOrderDetails(prev => ({ ...prev, customerName: value }))
            }}
            onKeyDown={handleCustomerKeyDown}
            onFocus={() => {
              // Show dropdown if there are results
              if (customerSearchResults.length > 0) {
                setShowCustomerDropdown(true)
              }
            }}
            disabled={isSubmittingOrder}
            placeholder="Search by name..."
            className="w-full pl-3 sm:pl-4 pr-10 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-sm sm:text-base"
          />
          
          {/* Loading spinner */}
          {searchingCustomers && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />
          )}
          
          {/* Clear button */}
          {!searchingCustomers && orderDetails.customerName && (
            <button
              onClick={() => {
                setShowCustomerDropdown(false)
                setOrderDetails(prev => ({ 
                  ...prev, 
                  customerName: '', 
                  phoneNumber: '', 
                  address: '' 
                }))
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Search Dropdown */}
        <AnimatePresence>
          {showCustomerDropdown && customerSearchResults.length > 0 && (
            <motion.div
              ref={customerDropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-emerald-200 overflow-hidden z-[100] max-h-72 overflow-y-auto"
            >
              <div className="p-2">
                {/* Results header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg mb-2 sticky top-0 z-10">
                  <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700">
                    {customerSearchResults.length} customer{customerSearchResults.length > 1 ? 's' : ''} found
                  </span>
                </div>
                
                {/* Customer results */}
                {customerSearchResults.map((customer, index) => (
                  <motion.button
                    key={customer._id}
                    onClick={() => handleCustomerSelect(customer)}
                    onMouseEnter={() => setSelectedCustomerIndex(index)}
                    type="button"
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                      selectedCustomerIndex === index
                        ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md'
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    {/* Customer Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Customer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-sm truncate">
                          {customer.name}
                        </p>
                        {customer.orderCount > 1 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            {customer.orderCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <p className="text-xs text-slate-600 font-medium">
                          {customer.phoneNumber}
                        </p>
                      </div>
                      
                      {customer.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {customer.address}
                          </p>
                        </div>
                      )}
                      
                      {customer.lastOrderDate && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Last order: {new Date(customer.lastOrderDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 transition-opacity ${
                      selectedCustomerIndex === index ? 'opacity-100 text-emerald-500' : 'opacity-0'
                    }`} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper text */}
        {orderDetails.orderType === 'takeaway' && !orderDetails.customerName && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Optional - Search by name or phone
          </p>
        )}
      </div>

      {/* Phone Number - Independent field */}
      <div className="relative">
        <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          Phone Number {orderDetails.orderType === 'delivery' && '*'}
        </label>
        <input
          type="tel"
          value={orderDetails.phoneNumber}
          onChange={(e) => {
            const value = e.target.value
            // ONLY update phone number
            setOrderDetails(prev => ({ ...prev, phoneNumber: value }))
          }}
          onKeyDown={handleCustomerKeyDown}
          onFocus={() => {
            // Show dropdown if there are results
            if (customerSearchResults.length > 0) {
              setShowCustomerDropdown(true)
            }
          }}
          disabled={isSubmittingOrder}
          placeholder={orderDetails.orderType === 'takeaway' ? '03XX-XXXXXXX (Optional)' : '03XX-XXXXXXX'}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-sm sm:text-base"
        />
      </div>
    </>
  )}

  {/* Address field for delivery */}
  {orderDetails.orderType === 'delivery' && (
    <div className="sm:col-span-2">
      <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
        Delivery Address *
      </label>
      <textarea
        value={orderDetails.address}
        onChange={(e) => setOrderDetails(prev => ({ ...prev, address: e.target.value }))}
        disabled={isSubmittingOrder}
        placeholder="Enter complete delivery address"
        rows={3}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none disabled:opacity-50 text-sm sm:text-base"
      />
    </div>
  )}



            
                </div>

                {/* Payment & Charges - 2 columns on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
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

              {/* Discount Percentage */}
  <div>
    <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
      <BadgePercent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
      Discount %
    </label>
    <input
      type="number"
      value={orderDetails.discountPercentage}
      onChange={(e) => updateDiscountPercentage(e.target.value)}
      disabled={isSubmittingOrder}
      min="0"
      max="100"
      step="0.5"
      placeholder="0"
      className="w-full px-2 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 text-xs sm:text-base"
    />
  </div>

  {/* Discount Amount */}
  <div>
    <label className="block text-slate-700 font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1.5">
      <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
      Discount ₨
    </label>
    <input
      type="number"
      value={orderDetails.discountAmount}
      onChange={(e) => updateDiscountAmount(e.target.value)}
      disabled={isSubmittingOrder}
      min="0"
      max={subtotal}
      step="10"
      placeholder="0"
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
  {/* Pending Orders Modal - ENHANCED VERSION */}
  <AnimatePresence>
    {isPendingOrdersOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
        onClick={() => setIsPendingOrdersOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-5 sm:p-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                <Timer className="w-5 h-5 sm:w-7 sm:h-7" />
                Pending Orders
              </h2>
              <p className="text-orange-100 text-xs sm:text-sm mt-1">
                {filteredPendingOrders.length} of {pendingOrders.length} orders
              </p>
            </div>
            <button
              onClick={() => setIsPendingOrdersOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order#, customer, phone, table..."
                  value={pendingOrdersSearch}
                  onChange={(e) => setPendingOrdersSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex gap-2 overflow-x-auto md:overflow-hidden custom-scrollbar ">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPendingOrderTypeFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2  ${
                    pendingOrderTypeFilter === 'all'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPendingOrderTypeFilter('dine-in')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    pendingOrderTypeFilter === 'dine-in'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Dine-In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPendingOrderTypeFilter('takeaway')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    pendingOrderTypeFilter === 'takeaway'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Takeaway
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPendingOrderTypeFilter('delivery')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    pendingOrderTypeFilter === 'delivery'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Delivery
                </motion.button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {isLoadingPendingOrders ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : filteredPendingOrders.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                </div>
                <p className="text-slate-500 font-semibold text-base sm:text-lg">
                  {pendingOrdersSearch || pendingOrderTypeFilter !== 'all' 
                    ? 'No orders match your filters' 
                    : 'No pending orders'}
                </p>
                <p className="text-slate-400 text-xs sm:text-sm mt-2">
                  {pendingOrdersSearch || pendingOrderTypeFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Orders will appear here once confirmed'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4  ">
                {filteredPendingOrders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200 hover:shadow-lg transition-all flex flex-col"
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
                    <div className="space-y-2 mb-3 flex-1">
                      {order.orderType === 'dine-in' && order.tableNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="w-4 h-4 text-slate-600" />
                          <span className="font-semibold text-slate-700">
                            Table: {order.tableNumber}
                          </span>
                        </div>
                      )}
                      {order.customerName !== 'Guest' && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-slate-600" />
                          <span className="font-medium text-slate-700">{order.customerName}</span>
                        </div>
                      )}
                      {order.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">{order.phoneNumber}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-slate-600 mt-0.5" />
                          <span className="text-slate-600 text-xs line-clamp-2">{order.address}</span>
                        </div>
                      )}

                      {/* Items Preview */}
                      <div className="mt-2 bg-white/60 rounded-lg p-2 max-h-24 overflow-y-auto">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1">
                            <span className="font-medium text-slate-700">
                              {item.icon} {item.name} x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mb-3 pb-3 border-t-2 border-orange-200 pt-3">
                      <span className="font-bold text-slate-700">Total:</span>
                      <span className="font-bold text-orange-600 text-lg">
                        ₨{order.total.toFixed(2)}
                      </span>
                    </div>

                {/* Action Buttons Row */}
  <div className="space-y-2">
    {/* Top Row: Edit, Print KOT, Print Token */}
    <div className="flex gap-2">
      {/* Edit Button */}
      <motion.button
        onClick={() => startEditingOrder(order)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 text-sm"
      >
        <Edit className="w-3.5 h-3.5" />
        Edit
      </motion.button>

      {/* Print KOT */}
      <motion.button
        onClick={() => handleReprintKOT(order)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="py-2 px-3 bg-slate-500 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
        title="Reprint KOT"
      >
        <Printer className="w-4 h-4" />
      </motion.button>

      {/* Print Token (Takeaway only) */}
      {order.orderType === 'takeaway' && (
        <motion.button
          onClick={() => handleReprintToken(order)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-2 px-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all"
          title="Reprint Token"
        >
          <Printer className="w-4 h-4" />
        </motion.button>
      )}
    </div>

    {/* Bottom Row: Complete and Cancel */}
    <div className="flex gap-2">
      {/* Complete Button */}
      <motion.button
        onClick={() => completeOrderHandler(order._id)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex md:text-[15.5px] text-xs items-center justify-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        Complete & Print Bill
      </motion.button>

      {/* Cancel Button */}
      <motion.button
        onClick={() => handleCancelOrder(order._id, order.orderNumber)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="py-2.5 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        title="Cancel Order"
      >
        <X className="w-4 h-4" />
        Cancel
      </motion.button>
    </div>
  </div>

                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>


        {/*POS Print Templates - Hidden from UI */}
      {currentPrintOrder && (
          <>
            {/* KOT - Kitchen Order Ticket */}
            {printType === 'kot' && (
              <div className="hidden print:block print-content">
                <div className="receipt-container">
                        {/* ✅ Kitchen Header (if split KOT is enabled) */}
  
           <div className="text-center border-b-2 border-black">
                    <h1 className= {`font-bold text-3xl ${currentPrintOrder.kitchenName ? 'flex items-center justify-evenly' : ''}`} >KOT <span className='font-semibold text-2xl'>{currentPrintOrder.kitchenName ? `( ${currentPrintOrder.kitchenName} )` : ''}</span></h1>
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
                    <h1 className="text-[22px] font-bold uppercase"> {restaurantSettings?.restaurantName || 'RESTAURANT'}</h1>
                    <p className="text-xs">{restaurantSettings?.address || ''}</p>
                    <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{restaurantSettings?.phone1 || ''}{restaurantSettings?.phone2 ? ` | ${restaurantSettings.phone2}` : ''}</p>
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
                    <h1 className="text-[22px] font-bold uppercase">{restaurantSettings?.restaurantName || 'RESTAURANT'}</h1>
                    <p className="text-xs">{restaurantSettings?.address || ''}</p>
                         <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{restaurantSettings?.phone1 || ''}{restaurantSettings?.phone2 ? ` | ${restaurantSettings.phone2}` : ''}</p>
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
      <span>
        Discount (
          {
            currentPrintOrder.discountPercentage.toString().includes(".")
              ? currentPrintOrder.discountPercentage.toString().split(".")[0]
              : currentPrintOrder.discountPercentage
          }%
        ):
      </span>
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
        
        {/*POS Print Styles */}
        <style jsx global>{`
    @media print {

            .modern-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #10b981 #f1f5f9;
    }

    .modern-scrollbar::-webkit-scrollbar {
      width: 8px;
    }

    .modern-scrollbar::-webkit-scrollbar-track {
      background: linear-gradient(to bottom, #f1f5f9, #e2e8f0);
      border-radius: 100px;
      margin: 4px 0;
    }

    .modern-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #10b981, #059669);
      border-radius: 100px;
      border: 2px solid #f1f5f9;
      transition: all 0.3s ease;
    }

    .modern-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #059669, #047857);
      border-color: #e2e8f0;
      width: 10px;
    }

    .modern-scrollbar::-webkit-scrollbar-thumb:active {
      background: linear-gradient(to bottom, #047857, #065f46);
    }

    /* Smooth scroll behavior */
    .modern-scrollbar {
      scroll-behavior: smooth;
    }

    /* Hide scrollbar on mobile for cleaner look (optional) */
    @media (max-width: 640px) {
      .modern-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      
      .modern-scrollbar::-webkit-scrollbar-thumb {
        border-width: 1px;
      }
    }
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

  {/* Edit Order Modal - ENHANCED VERSION */}
  {/* Edit Order Modal - FIXED & BALANCED VERSION */}
  <AnimatePresence>
    {isEditModalOpen && editingOrder && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 z-50"
        onClick={() => !isSavingEdit && setIsEditModalOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-7xl h-full sm:h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 text-white p-3 sm:p-6 flex items-center justify-between flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-2xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0" />
                <span className="truncate">Edit Order</span>
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">
                {editingOrder.orderNumber} • {editingOrder.customerName}
              </p>
            </div>
            <button
              onClick={() => !isSavingEdit && setIsEditModalOpen(false)}
              disabled={isSavingEdit}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 flex-shrink-0 ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Main Content Grid - FIXED LAYOUT */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side - Menu Items - FIXED HEIGHT */}
            <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
              {/* Search & Categories - FIXED AT TOP */}
          {/* Search & Categories - FIXED AT TOP */}
  <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 flex-shrink-0">
    {/* Search & Quantity Input - Inline */}
    <div className="flex gap-2 sm:gap-3">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10" />
        <input
          ref={editSearchInputRef}
          type="text"
          autoFocus
          placeholder="Search menu items..."
          value={editSearchQuery}
          onChange={(e) => setEditSearchQuery(e.target.value)}
          onKeyDown={handleEditSearchKeyDown}
          onFocus={() => editSearchQuery && setShowEditSearchDropdown(true)}
          disabled={selectedEditItemForQuantity !== null}
          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Search Dropdown */}
        <AnimatePresence>
          {showEditSearchDropdown && editSearchResults.length > 0 && (
            <motion.div
              ref={editSearchDropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-60 sm:max-h-80 overflow-y-auto"
            >
              <div className="p-1.5 sm:p-2">
                {editSearchResults.map((product, index) => (
                  <motion.button
                    key={product._id}
                    onClick={() => handleEditItemSelectForQuantity(product)}
                    onMouseEnter={() => setSelectedEditSearchIndex(index)}
                    className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all text-left ${
                      selectedEditSearchIndex === index
                        ? 'bg-blue-50 border-2 border-blue-500'
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
                      <p className="font-bold text-blue-600 text-sm">₨{product.sellingPrice}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quantity Input - Shows when item selected */}
      <AnimatePresence>
        {selectedEditItemForQuantity ? (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            {/* Item Preview Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-xl">
              <span className="text-2xl">{selectedEditItemForQuantity.categoryId?.icon || '🍽️'}</span>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate max-w-[100px]">
                  {selectedEditItemForQuantity.name}
                </p>
                <p className="text-[10px] text-blue-600 font-bold">
                  ₨{selectedEditItemForQuantity.sellingPrice}
                </p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1.5 bg-white border-2 border-blue-500 rounded-xl p-1 shadow-lg">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEditQuickQuantity(Math.max(0, editQuickQuantity - 1))}
                className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
              
              <input
                ref={editQuantityInputRef}
                type="number"
                value={editQuickQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  setEditQuickQuantity(Math.max(0, Math.min(999, val)))
                }}
                onKeyDown={handleEditQuantityKeyDown}
                min="0"
                max="999"
                className="w-12 sm:w-16 text-center text-lg sm:text-xl font-bold px-2 py-1 border-2 border-transparent focus:border-blue-500 rounded-lg focus:outline-none bg-slate-50 transition-all"
              />
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEditQuickQuantity(editQuickQuantity + 1)}
                className="p-1.5 sm:p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
            </div>

            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditQuantityConfirm}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </motion.button>

            {/* Cancel Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedEditItemForQuantity(null)
                setEditQuickQuantity(0)
                editSearchInputRef.current?.focus()
              }}
              className="p-2 sm:p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          // Placeholder when no item selected
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 sm:py-3 bg-slate-100 border-2 border-slate-200 rounded-xl"
          >
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium text-sm hidden sm:inline">
              Qty
            </span>
            <span className="text-slate-400 font-bold text-lg">-</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Selected Item Info Banner - Mobile Only */}
    <AnimatePresence>
      {selectedEditItemForQuantity && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="sm:hidden mt-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-lg flex items-center gap-2"
        >
          <span className="text-2xl">{selectedEditItemForQuantity.categoryId?.icon || '🍽️'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">
              {selectedEditItemForQuantity.name}
            </p>
            <p className="text-xs text-blue-600">
              ₨{selectedEditItemForQuantity.sellingPrice} × {editQuickQuantity} = ₨{(selectedEditItemForQuantity.sellingPrice * editQuickQuantity).toFixed(2)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Category Filters - KEEP EXISTING */}
    <div className="flex gap-2 overflow-x-auto pb-2 mordern-scrollbar">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setEditSelectedCategory('All')}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
          editSelectedCategory === 'All'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
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
          onClick={() => setEditSelectedCategory(category.name)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 ${
            editSelectedCategory === category.name
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span className="text-base sm:text-lg">{category.icon}</span>
          {category.name}
        </motion.button>
      ))}
    </div>
  </div>

              {/* Menu Items Grid - SCROLLABLE AREA */}
              <div className="flex-1 overflow-y-auto modern-scrollbar pr-2">
                {isLoadingMenuItems ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : getEditFilteredProducts().length === 0 ? (
                  <div className="text-center h-full flex flex-col items-center justify-center">
                    <Coffee className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold text-sm sm:text-base">No items found</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Try selecting a different category
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 pb-3">
                    {getEditFilteredProducts().map((item, index) => (
                      <motion.button
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToEditCart(item)}
                        className="bg-gradient-to-br from-white to-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm border-2 border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all group h-fit"
                      >
                        <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                          {item.categoryId?.icon || '🍽️'}
                        </div>
                        <h3 className="font-bold text-slate-800 text-[10px] sm:text-xs lg:text-sm mb-1 line-clamp-2 min-h-[2rem]">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] sm:text-[10px] text-slate-500 truncate">{item.categoryId?.name}</span>
                        </div>
                        <p className="text-blue-600 font-bold text-xs sm:text-sm mt-1">
                          ₨{item.sellingPrice}
                        </p>
                        <div className="mt-1 sm:mt-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Add
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Edit Cart - FIXED WIDTH & HEIGHT */}
            <div className="w-full lg:w-96 xl:w-[420px] bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col overflow-hidden">
              {/* Cart Header - FIXED */}
              <div className="p-3 sm:p-4 lg:p-6 border-b-2 border-blue-200 flex-shrink-0">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Order Items
                  <span className="ml-auto px-2 sm:px-3 py-1 bg-blue-500 text-white rounded-full text-xs sm:text-sm font-bold">
                    {editCart.length}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {editCart.reduce((sum, item) => sum + item.quantity, 0)} total items
                </p>
              </div>

              {/* Cart Items - SCROLLABLE */}
              <div className="flex-1 overflow-y-auto md:max-h-[100%] max-h-[20vh] p-3 sm:p-4 lg:p-6 modern-scrollbar">
                <div className="space-y-2">
                  <AnimatePresence>
                    {editCart.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8 sm:py-12"
                      >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-semibold text-sm">Cart is empty</p>
                        <p className="text-slate-400 text-xs mt-1">Add items from menu</p>
                      </motion.div>
                    ) : (
  editCart.map((item, index) => (
    <motion.div
      key={item._id}
      onClick={() => toggleKOTItem(item._id)} // ✅ KEEP THIS - Clicking card toggles KOT
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border-2 transition-all shadow-sm cursor-pointer ${
        selectedKOTItems.includes(item._id)
          ? 'border-blue-400 bg-blue-50/30 shadow-md shadow-blue-200/50'
          : 'border-blue-100 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* KOT Checkbox - Visual indicator only */}
        <div
          className={`flex-shrink-0 p-1 sm:p-1.5 rounded-lg transition-all ${
            selectedKOTItems.includes(item._id)
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {selectedKOTItems.includes(item._id) ? (
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <Square className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </div>

        {/* Item Icon */}
        <div className="text-xl sm:text-2xl flex-shrink-0">{item.categoryId?.icon || '🍽️'}</div>
        
        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{item.name}</p>
            {selectedKOTItems.includes(item._id) && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex-shrink-0"
              >
                <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[9px] font-bold flex items-center gap-1">
                  <Printer className="w-2.5 h-2.5" />
                  KOT
                </span>
              </motion.div>
            )}
          </div>
          <p className="text-xs text-slate-500">₨{item.sellingPrice} × {item.quantity}</p>
          <p className="text-xs sm:text-sm font-bold text-blue-600 mt-0.5">
            ₨{(item.sellingPrice * item.quantity).toFixed(2)}
          </p>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 rounded-md sm:rounded-lg p-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation() // ✅ IMPORTANT - Prevents toggling KOT
                const newCart = editCart.map((i) =>
                  i._id === item._id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
                )
                setEditCart(newCart)
              }}
              className="p-0.5 sm:p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
            <span className="w-5 sm:w-7 text-center font-bold text-slate-800 text-xs sm:text-sm">
              {item.quantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation() // ✅ IMPORTANT - Prevents toggling KOT
                const newCart = editCart.map((i) =>
                  i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
                )
                setEditCart(newCart)
              }}
              className="p-0.5 sm:p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation() // ✅ IMPORTANT - Prevents toggling KOT
              setEditCart(editCart.filter((i) => i._id !== item._id))
              setSelectedKOTItems(selectedKOTItems.filter(id => id !== item._id))
              showNotification(`${item.name} removed`, 'success')
            }}
            className="p-1 sm:p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mx-auto" />
          </button>
        </div>
      </div>
    </motion.div>
  ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Cart Summary & Actions - FIXED AT BOTTOM */}
              {editCart.length > 0 && (
                <div className="border-t-2 border-blue-200 p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 bg-white/60 flex-shrink-0">
                  <div className="flex justify-between items-center text-sm sm:text-lg font-bold text-slate-800">
                    <span>Items Total:</span>
                    <span className="text-xl sm:text-2xl text-blue-600">
                      ₨{editCart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
              <div className="space-y-2">
    {/* Print Selected KOT Button */}
    <motion.button
      onClick={handlePrintSelectedKOT}
      disabled={selectedKOTItems.length === 0}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:shadow-2xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
      Print KOT ({selectedKOTItems.length} items)
    </motion.button>

    {/* Save Changes Button */}
    <motion.button
      onClick={saveEditedOrder}
      disabled={isSavingEdit || editCart.length === 0}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:shadow-2xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isSavingEdit ? (
        <>
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          Saving Changes...
        </>
      ) : (
        <>
          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
          Save Changes & Update Order
        </>
      )}
    </motion.button>

    <button
      onClick={() => !isSavingEdit && setIsEditModalOpen(false)}
      disabled={isSavingEdit}
      className="w-full py-2 sm:py-2.5 border-2 border-slate-200 text-slate-600 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
    >
      Cancel
    </button>
  </div>
                  
                
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>


  {/* Cancel Confirmation Modal */}
  <AnimatePresence>
    {cancelConfirmation && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
        onClick={() => setCancelConfirmation(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-5 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cancel Order</h2>
              <p className="text-red-100 text-sm">This action cannot be undone</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-slate-700 text-center mb-2">
              Are you sure you want to cancel order
            </p>
            <p className="text-2xl font-bold text-center text-slate-800 mb-4">
              {cancelConfirmation.orderNumber}?
            </p>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Warning:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Order will be marked as cancelled</li>
                    <li>Items will not be prepared</li>
                    <li>This cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>

          {/* Buttons */}
  <div className="flex gap-3">
    <motion.button
      onClick={() => setCancelConfirmation(null)}
      disabled={isCancellingOrder} // ✅ DISABLE WHILE CANCELLING
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Keep Order
    </motion.button>
    <motion.button
      onClick={confirmCancelOrder}
      disabled={isCancellingOrder} // ✅ DISABLE WHILE CANCELLING
      whileHover={{ scale: isCancellingOrder ? 1 : 1.02 }}
      whileTap={{ scale: isCancellingOrder ? 1 : 0.98 }}
      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isCancellingOrder ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cancelling...</span>
        </>
      ) : (
        <>
          <X className="w-5 h-5" />
          <span>Yes, Cancel Order</span>
        </>
      )}
    </motion.button>
  </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Completion Confirmation Modal */}
  <AnimatePresence>
    {completionConfirmation && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
        onClick={() => setCompletionConfirmation(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Complete Order</h2>
              <p className="text-emerald-100 text-sm">{completionConfirmation.orderNumber}</p>
            </div>
            <button
              onClick={() => setCompletionConfirmation(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Order Summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Order Summary
              </h3>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Order Type:</span>
                  <span className="font-semibold">{completionConfirmation.orderType}</span>
                </div>
                {completionConfirmation.customerName !== 'Guest' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Customer:</span>
                    <span className="font-semibold">{completionConfirmation.customerName}</span>
                  </div>
                )}
                {completionConfirmation.tableNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Table:</span>
                    <span className="font-semibold">{completionConfirmation.tableNumber}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="bg-white/60 rounded-lg p-3 max-h-32 overflow-y-auto">
                {completionConfirmation.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-emerald-100 last:border-0">
                    <span className="font-medium text-slate-700">
                      {item.icon} {item.name} x{item.quantity}
                    </span>
                    <span className="font-bold text-emerald-600">
                      ₨{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Confirm or Edit Details
              </h3>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payment Method
                </label>
                <select
                  value={completionDetails.paymentMethod}
                  onChange={(e) =>
                    setCompletionDetails({ ...completionDetails, paymentMethod: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Grid for Charges */}
              <div className="grid grid-cols-2 gap-3">
                {/* Tax */}
                {completionConfirmation.orderType === 'dine-in' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2 text-sm flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      Service Charges %
                    </label>
                    <input
                      type="number"
                      value={completionDetails.taxPercentage}
                      onChange={(e) =>
                        setCompletionDetails({ ...completionDetails, taxPercentage: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                    />
                  </div>
                )}

                {/* Delivery Charge */}
                {completionConfirmation.orderType === 'delivery' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2 text-sm flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-emerald-600" />
                      Delivery Charge
                    </label>
                    <input
                      type="number"
                      value={completionDetails.deliveryCharge}
                      onChange={(e) =>
                        setCompletionDetails({ ...completionDetails, deliveryCharge: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                    />
                  </div>
                )}

                {/* Discount Percentage */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-sm flex items-center gap-1.5">
                    <BadgePercent className="w-4 h-4 text-emerald-600" />
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={completionDetails.discountPercentage}
                    onChange={(e) => {
                      const subtotal = completionConfirmation.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                      const percent = parseFloat(e.target.value) || 0
                      const amount = (subtotal * percent) / 100
                      setCompletionDetails(prev => ({
                        ...prev,
                        discountPercentage: percent,
                        discountAmount: amount
                      }))
                    }}
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0"
                    className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                  />
                </div>

                {/* Discount Amount */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Discount ₨
                  </label>
                  <input
                    type="number"
                    value={completionDetails.discountAmount}
                    onChange={(e) => {
                      const subtotal = completionConfirmation.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                      const amt = parseFloat(e.target.value) || 0
                      const percent = subtotal > 0 ? (amt / subtotal) * 100 : 0
                      setCompletionDetails(prev => ({
                        ...prev,
                        discountAmount: amt,
                        discountPercentage: Math.min(percent, 100)
                      }))
                    }}
                    min="0"
                    step="10"
                    placeholder="0"
                    className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={completionDetails.notes}
                  onChange={(e) =>
                    setCompletionDetails({ ...completionDetails, notes: e.target.value })
                  }
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* Updated Totals */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border-2 border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3">Updated Bill Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold">
                    ₨{completionConfirmation.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ).toFixed(2)}
                  </span>
                </div>
                {completionDetails.taxPercentage > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Service Charges ({completionDetails.taxPercentage}%):</span>
                    <span className="font-bold">
                      ₨{(
                        completionConfirmation.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) * (completionDetails.taxPercentage / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                {completionDetails.deliveryCharge > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Delivery Charge:</span>
                    <span className="font-bold">₨{completionDetails.deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                {(completionDetails.discountPercentage > 0 || completionDetails.discountAmount > 0) && (
                  <div className="flex justify-between text-emerald-600">
                    <span>
                      Discount
                      {completionDetails.discountPercentage > 0 && ` (${completionDetails.discountPercentage.toFixed(1)}%)`}:
                    </span>
                    <span className="font-bold">
                      -₨{(
                        completionDetails.discountPercentage > 0
                          ? (completionConfirmation.items.reduce(
                              (sum, item) => sum + item.price * item.quantity,
                              0
                            ) * completionDetails.discountPercentage) / 100
                          : completionDetails.discountAmount
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-2" />
                <div className="flex justify-between text-lg font-bold text-slate-800 pt-2">
                  <span>Total:</span>
                  <span className="text-2xl text-emerald-600">
                    ₨{(() => {
                      const subtotal = completionConfirmation.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                      const tax = subtotal * (completionDetails.taxPercentage / 100)
                      const discount = completionDetails.discountPercentage > 0
                        ? (subtotal * completionDetails.discountPercentage) / 100
                        : completionDetails.discountAmount
                      return (subtotal + tax - discount + completionDetails.deliveryCharge).toFixed(2)
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t-2 border-slate-200 p-5 flex gap-3 bg-slate-50 flex-shrink-0">
            <motion.button
              onClick={() => setCompletionConfirmation(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 border-2 border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-white transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={confirmCompleteOrder}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Bill & Complete Order
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

      </>
    )
  }