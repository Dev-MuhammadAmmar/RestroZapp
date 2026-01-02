  'use client';
  import React, { useState, useEffect , useRef } from 'react';
  import { Package, CheckSquare , XSquare,Truck , Info  ,Loader2  ,  Edit, Check, Plus, Search, AlertCircle, ShoppingCart, DollarSign, Trash2, X, ChevronDown, Printer, Users, Archive, RefreshCw, CheckCircle, XCircle, Eye, Filter, Calendar, Menu, TrendingUp, TrendingDown, BarChart3, PieChart, RotateCcw , CreditCard , Clock ,  Building2, Phone, Mail, MapPin, Star} from 'lucide-react';
  import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
  import { motion, AnimatePresence } from 'framer-motion';

  import {
    createVendor,
    updateVendor,
    deleteVendor,
    getAllVendors,
    searchVendors,
    getVendorDetails,
    syncVendorStats, 
    makeVendorPayment 
  } from '@/lib/actions/vendorActions';
  import {
    createGroceryPurchase,
    updateGroceryPurchase,
    deleteGroceryPurchase,
    markCreditPaid,
    getAllGroceries,
    getUnpaidCredits,
    getGroceryStats,
    getVendorsList,
    archiveGroceryPurchase,
    getArchivedGroceries,
    restoreGroceryPurchase,
    getMonthlyTrend,
    getCategoryAnalysis,
    getVendorAnalysis
  } from '@/lib/actions/groceryActions';
  import { getSettings } from '@/lib/actions/settings';

  const GroceryManagement = () => {
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
    
    const [vendorFilterStatus, setVendorFilterStatus] = useState('ALL');
  const [vendorSortBy, setVendorSortBy] = useState('name');
    // NEW: Vendor-related states
  const [showVendorSidebar, setShowVendorSidebar] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [vendorDateFilter, setVendorDateFilter] = useState('all');
  const [vendorCustomDateRange, setVendorCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [showVendorCustomDateModal, setShowVendorCustomDateModal] = useState(false);
  const [vendorPaymentHistory, setVendorPaymentHistory] = useState(null);
  const [selectedVendorIndex, setSelectedVendorIndex] = useState(-1);

  // ADD THESE NEW STATES
  const [printVendor, setPrintVendor] = useState(null);
  const [showVendorPaymentHistoryModal, setShowVendorPaymentHistoryModal] = useState(false);
  const [selectedVendorForHistory, setSelectedVendorForHistory] = useState(null);

  const vendorInputRef = useRef(null);
  const [vendorFormData, setVendorFormData] = useState({
    vendorName: '',
    phoneNumber: ''
  });
    const [loadingMore, setLoadingMore] = useState(false);
    // State Management
    const [grocerySettings, setGrocerySettings] = useState(null);
    const [groceries, setGroceries] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPayment, setFilterPayment] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('today');
    const [unpaidCredit, setUnpaidCredit] = useState({ total: 0, count: 0, overdueCount: 0, overdueAmount: 0 });
    const [stats, setStats] = useState(null);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [vendorAnalysis, setVendorAnalysis] = useState([]);
    const [printGrocery, setPrintGrocery] = useState(null);
    const [viewDetails, setViewDetails] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showArchivedView, setShowArchivedView] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGroceryForPayment, setSelectedGroceryForPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentAmount: '',
    paymentMethod: 'CASH',
    paymentNote: '',
    paidBy: ''  // NEW FIELD
  });
  // NEW STATES FOR VENDOR PAYMENT
  const [showVendorPaymentModal, setShowVendorPaymentModal] = useState(false);
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState(null);
  const [vendorPaymentData, setVendorPaymentData] = useState({
    paymentAmount: '',
    paymentMethod: 'CASH',
    paymentNote: '',
    paidBy: ''
  });
  const [vendorPage, setVendorPage] = useState(1);
  const VENDORS_PER_PAGE = 20;
  const [vendorLoading, setVendorLoading] = useState(false);
  const [showVendorPaymentHistoryFilterModal, setShowVendorPaymentHistoryFilterModal] = useState(false);
  const [vendorHistoryDateFilter, setVendorHistoryDateFilter] = useState('all');
  const [vendorHistoryCustomRange, setVendorHistoryCustomRange] = useState({ startDate: '', endDate: '' });
  const paginatedVendors = vendors.slice(
    (vendorPage - 1) * VENDORS_PER_PAGE,
    vendorPage * VENDORS_PER_PAGE
  );
    const [selectedGroceryForReturn, setSelectedGroceryForReturn] = useState(null);
    const [returnData, setReturnData] = useState({
      returnQuantity: '',
      returnReason: '',
      returnNotes: ''
    });
    const [displayLimit, setDisplayLimit] = useState(50);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedGroceryForHistory, setSelectedGroceryForHistory] = useState(null);
  const [showReturnHistoryModal, setShowReturnHistoryModal] = useState(false);
  const [selectedGroceryForReturnHistory, setSelectedGroceryForReturnHistory] = useState(null);
    const [formData, setFormData] = useState({
      itemName: '',
      category: 'Other',
      quantity: '',
      unit: 'kg',
      unitPrice: '',
      vendorName: '',
      vendorContact: '',
      orderedBy: '',
      orderedByRole: 'Manager',
      totalAmount: '',
      paymentMethod: 'CREDIT',
      status: 'PENDING',
      notes: ''
    });

    const categories = [
      'Vegetables', 'Fruits', 'Meat & Poultry', 'Seafood',
      'Dairy & Eggs', 'Grains & Cereals', 'Spices & Condiments',
      'Beverages', 'Bakery', 'Frozen Foods', 'Cooking Oil',
      'Cleaning Supplies', 'Disposables', 'Other'
    ];

    const units = ['kg', 'pcs', 'ltr', 'box', 'bag', 'dozen', 'gm', 'ml', 'packet', 'carton'];
    const roles = ['Owner', 'Manager', 'Chef', 'Supervisor', 'Staff'];

    const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // Animation variants
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: "easeOut"
        }
      }
    };

    const cardVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.3,
          ease: "easeOut"
        }
      }
    };

    useEffect(() => {
      loadInitialStats();
      loadAnalyticsData();


    }, []);
    const loadRestaurantSettings = async () => {
      try {
        const response = await getSettings()
        if (response.success) {
          setGrocerySettings(response.data)
        }
      } catch (error) {
        console.error('Error loading restaurant settings:', error)
      }
    }

  // Update useEffect that loads data (around line 105)
  useEffect(() => {
    if (sidebarOpen) {
      setDisplayLimit(50); // RESET pagination
      loadGroceryData();
  
    }
  }, [sidebarOpen, showArchivedView, dateFilter, filterStatus, filterPayment, filterCategory]);

  // Also reset when search changes
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchTerm]);

  useEffect(() => {
    loadRestaurantSettings()
  }, [])

    useEffect(() => {
      if (formData.quantity && formData.unitPrice) {
        const total = parseFloat(formData.quantity) * parseFloat(formData.unitPrice);
        setFormData(prev => ({ ...prev, totalAmount: total.toFixed(2) }));
      } else if (formData.unitPrice === '' || formData.unitPrice === '0') {
        setFormData(prev => ({ ...prev, unitPrice: '' }));
      }
    }, [formData.quantity, formData.unitPrice]);

    const loadInitialStats = async () => {
      try {
        const [creditsRes, statsRes, vendorsRes] = await Promise.all([
          getUnpaidCredits(),
          getGroceryStats(dateFilter),
          getVendorsList()
        ]);

        if (creditsRes.success) setUnpaidCredit(creditsRes);
        if (statsRes.success) setStats(statsRes.data);
        if (vendorsRes.success) setVendors(vendorsRes.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    const loadAnalyticsData = async () => {
      try {
        const [trendRes, categoryRes, vendorRes] = await Promise.all([
          getMonthlyTrend(6),
          getCategoryAnalysis(new Date(new Date().setMonth(new Date().getMonth() - 1)), new Date()),
          getVendorAnalysis()
        ]);

        if (trendRes.success) setMonthlyTrend(trendRes.data);
        if (categoryRes.success) setCategoryData(categoryRes.data);
        if (vendorRes.success) setVendorAnalysis(vendorRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    const loadGroceryData = async () => {
      setLoading(true);
      try {
        const filters = buildFilters();
        const groceriesRes = showArchivedView 
          ? await getArchivedGroceries() 
          : await getAllGroceries(filters);

        if (groceriesRes.success) {
          setGroceries(groceriesRes.data);
        }
        
        await loadInitialStats();
      } catch (error) {
        showNotification('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

  const buildFilters = () => {
    const filters = {};
    
    const now = new Date();
    switch(dateFilter) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filters.createdAt = { $gte: todayStart };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filters.createdAt = { $gte: weekAgo };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filters.createdAt = { $gte: monthStart };
        break;
  // Around line 131
  case 'custom':
    if (customDateRange.startDate && customDateRange.endDate) {
      const start = new Date(customDateRange.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateRange.endDate);
      end.setHours(23, 59, 59, 999);
      
      // ADD VALIDATION
      if (start > end) {
        showNotification('Start date cannot be after end date', 'error');
        return {};
      }
      
      filters.createdAt = { $gte: start, $lte: end };
    }
    break;
      case 'all':
        // No date filter
        break;
    }
    
    if (filterStatus !== 'ALL') filters.status = filterStatus;
    if (filterPayment !== 'ALL') filters.paymentMethod = filterPayment;
    if (filterCategory !== 'ALL') filters.category = filterCategory;
    
    return filters;
  };


  useEffect(() => {
    if (dateFilter === 'custom' && !customDateRange.startDate) {
      setShowCustomDateModal(true);
    }
  }, [dateFilter]);

    const showNotification = (message, type = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
    };

    const setLoadingState = (key, value) => {
      setActionLoading(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoadingState('submit', true);
      
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
        totalAmount: parseFloat(formData.totalAmount) || 0
      };

      const result = editingId 
        ? await updateGroceryPurchase(editingId, data)
        : await createGroceryPurchase(data);

      setLoadingState('submit', false);

  if (result.success) {
      showNotification(editingId ? 'Purchase updated!' : 'Purchase added!');
      resetForm();
      if (sidebarOpen) loadGroceryData();
      else {
        loadInitialStats();
        loadAnalyticsData();
      }
     
    } else {
      showNotification(result.error, 'error');
    }
  };
 const handleVendorPaymentSubmit = async (e) => {
  e.preventDefault();
  
  const amount = parseFloat(vendorPaymentData.paymentAmount);
  
  if (amount <= 0 || amount > selectedVendorForPayment.totalPending) {
    showNotification(`Invalid amount. Max: ₨${selectedVendorForPayment.totalPending.toFixed(2)}`, 'error');
    return;
  }

  setLoadingState('vendorPayment', true);

  const result = await makeVendorPayment(
    selectedVendorForPayment.vendorName,
    amount,
    vendorPaymentData.paymentMethod,
    vendorPaymentData.paymentNote,
    vendorPaymentData.paidBy
  );

  setLoadingState('vendorPayment', false);

  if (result.success) {
    showNotification(result.message);

    // CRITICAL FIX: Get fresh vendor data AFTER payment
    const freshVendorResult = await getAllVendors({ isActive: true });
    const freshVendor = freshVendorResult.success 
      ? freshVendorResult.data.find(v => v.vendorName === selectedVendorForPayment.vendorName)
      : null;

    if (!freshVendor) {
      // Fallback: calculate manually if vendor not found
      const previousPaid = selectedVendorForPayment.totalPaid || 0;
      const newTotalPaid = previousPaid + amount;
      const newRemaining = Math.max(0, (selectedVendorForPayment.totalPurchaseValue || 0) - newTotalPaid);
      
      const paymentReceipt = {
        ...selectedVendorForPayment,
        paymentAmount: amount,
        paymentMethod: vendorPaymentData.paymentMethod,
        paymentNote: vendorPaymentData.paymentNote,
        paidBy: vendorPaymentData.paidBy,
        paymentDate: new Date(),
        previousPaid: previousPaid,
        totalPaid: newTotalPaid,
        totalPending: newRemaining,
        isVendorPaymentReceipt: true
      };
      
      setPrintVendor(paymentReceipt);
    } else {
      // Use fresh vendor data
      const paymentReceipt = {
        ...freshVendor,
        paymentAmount: amount,
        paymentMethod: vendorPaymentData.paymentMethod,
        paymentNote: vendorPaymentData.paymentNote,
        paidBy: vendorPaymentData.paidBy,
        paymentDate: new Date(),
        previousPaid: (freshVendor.totalPaid || 0) - amount, // Calculate what it was before
        isVendorPaymentReceipt: true
      };
      
      setPrintVendor(paymentReceipt);
    }
    
    setShowVendorPaymentModal(false);
    setSelectedVendorForPayment(null);
    loadVendors(); // Refresh vendor list
    if (sidebarOpen) loadGroceryData();
    
    // Print payment receipt
    setTimeout(() => window.print(), 100);
  } else {
    showNotification(result.error || 'Payment failed', 'error');
  }
};
    const handleEdit = (grocery) => {
      setFormData({
        itemName: grocery.itemName,
        category: grocery.category,
        quantity: grocery.quantity.toString(),
        unit: grocery.unit,
        unitPrice: grocery.unitPrice?.toString() || '',
        vendorName: grocery.vendorName,
        vendorContact: grocery.vendorContact || '',
        orderedBy: grocery.orderedBy,
        orderedByRole: grocery.orderedByRole,
        totalAmount: grocery.totalAmount.toString(),
        paymentMethod: grocery.paymentMethod,
        status: grocery.status,
        notes: grocery.notes || ''
      });
      setEditingId(grocery._id);
      setShowForm(true);
    };

    const handleDelete = async (id) => {
      if (!confirm('Delete this purchase?')) return;
      
      setLoadingState(`delete-${id}`, true);
      const result = await deleteGroceryPurchase(id);
      setLoadingState(`delete-${id}`, false);

      if (result.success) {
        showNotification('Purchase deleted!');
        loadGroceryData();
        loadAnalyticsData();
      } else {
        showNotification(result.error, 'error');
      }
    };

    const handleArchive = async (id) => {
      setLoadingState(`archive-${id}`, true);
      const result = await archiveGroceryPurchase(id);
      setLoadingState(`archive-${id}`, false);

      if (result.success) {
        showNotification('Purchase archived!');
        loadGroceryData();
      } else {
        showNotification(result.error, 'error');
      }
    };

    const handleRestore = async (id) => {
      setLoadingState(`restore-${id}`, true);
      const result = await restoreGroceryPurchase(id);
      setLoadingState(`restore-${id}`, false);

      if (result.success) {
        showNotification('Purchase restored!');
        loadGroceryData();
      } else {
        showNotification(result.error, 'error');
      }
    };
  const handleOpenPaymentModal = (grocery) => {
    setSelectedGroceryForPayment(grocery);
    setPaymentData({
      paymentAmount: grocery.remainingAmount.toFixed(2),
      paymentMethod: 'CASH',
      paymentNote: '',
      paidBy: ''  // NEW FIELD
    });
    setShowPaymentModal(true);
  };
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentData.paymentAmount);
    
    if (amount <= 0 || amount > selectedGroceryForPayment.remainingAmount) {
      showNotification(`Invalid amount. Max: ₨${selectedGroceryForPayment.remainingAmount}`, 'error');
      return;
    }

    setLoadingState('payment', true);

  const result = await markCreditPaid(
    selectedGroceryForPayment._id, 
    amount, 
    paymentData.paymentMethod,
    paymentData.paymentNote,
    paymentData.paidBy  // NEW PARAMETER
  );

    setLoadingState('payment', false);

    if (result.success) {
      showNotification(result.message);
      
      // Create payment receipt for printing
    // Create payment receipt for printing
  const paymentReceipt = {
    ...selectedGroceryForPayment,
    paymentAmount: amount,
    paymentMethod: paymentData.paymentMethod,
    paymentNote: paymentData.paymentNote,
    paidBy: paymentData.paidBy,  // NEW
    paymentDate: new Date(),
    newPaidAmount: (selectedGroceryForPayment.paidAmount || 0) + amount,
    newRemainingAmount: selectedGroceryForPayment.remainingAmount - amount,
    isPaymentReceipt: true
  };
      
      setShowPaymentModal(false);
      setSelectedGroceryForPayment(null);
      loadGroceryData();
      
      // Print payment receipt
      setPrintGrocery(paymentReceipt);
      setTimeout(() => window.print(), 100);
    } else {
      showNotification(result.error || 'Payment failed', 'error');
    }
  };
  // Load all vendors
  const loadVendors = async () => {
    setVendorLoading(true);
    try {
      const result = await getAllVendors({ isActive: true });
      if (result.success) {
        let filtered = result.data;
        
        // Apply status filter
        if (vendorFilterStatus === 'WITH_PENDING') {
          filtered = filtered.filter(v => v.totalPending > 0);
        } else if (vendorFilterStatus === 'FULLY_PAID') {
          filtered = filtered.filter(v => v.totalPending === 0);
        } else if (vendorFilterStatus === 'ACTIVE') {
          filtered = filtered.filter(v => v.isActive);
        } else if (vendorFilterStatus === 'INACTIVE') {
          filtered = filtered.filter(v => !v.isActive);
        }
        
        // Apply search filter
        if (vendorSearchTerm) {
          const search = vendorSearchTerm.toLowerCase();
          filtered = filtered.filter(v => 
            v.vendorName.toLowerCase().includes(search) ||
            v.phoneNumber.includes(search)
          );
        }
        
        // Apply sorting
        if (vendorSortBy === 'name') {
          filtered.sort((a, b) => a.vendorName.localeCompare(b.vendorName));
        } else if (vendorSortBy === 'pending') {
          filtered.sort((a, b) => b.totalPending - a.totalPending);
        } else if (vendorSortBy === 'orders') {
          filtered.sort((a, b) => b.totalOrders - a.totalOrders);
        } else if (vendorSortBy === 'recent') {
          filtered.sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
        }
        
        setVendors(filtered);
        showNotification(`${filtered.length} vendor(s) loaded`, 'success');
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
      showNotification('Failed to load vendors', 'error');
    } finally {
      setVendorLoading(false);
    }
  };
  // Enhanced vendor search with loading state
  const handleVendorSearch = async (value) => {
    setVendorSearchTerm(value);
    setFormData(prev => ({ ...prev, vendorName: value }));
    
    if (value.length >= 2) {
      setLoadingState('vendorSearch', true);
      try {
        const result = await searchVendors(value);
        if (result.success) {
          setVendorSuggestions(result.data);
          setShowVendorSuggestions(true);
          setSelectedVendorIndex(-1);
        }
      } catch (error) {
        console.error('Vendor search error:', error);
      } finally {
        setLoadingState('vendorSearch', false);
      }
    } else {
      setVendorSuggestions([]);
      setShowVendorSuggestions(false);
      setSelectedVendorIndex(-1);
    }
  };

  // Select vendor from suggestions
  // Enhanced vendor selection with notification
  const handleSelectVendor = (vendor) => {
    setFormData(prev => ({
      ...prev,
      vendorName: vendor.vendorName,
      vendorContact: vendor.phoneNumber || ''
    }));
    
    setVendorSearchTerm(vendor.vendorName);
    setShowVendorSuggestions(false);
    setSelectedVendorIndex(-1);
    
    // Show success notification with vendor info
    showNotification(
      `Vendor: ${vendor.vendorName}${vendor.totalPending > 0 ? ` (Pending: ₨${vendor.totalPending.toFixed(2)})` : ''}`, 
      'success'
    );
  };
  // Close vendor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vendorInputRef.current &&
        !vendorInputRef.current.contains(event.target) &&
        showVendorSuggestions
      ) {
        setShowVendorSuggestions(false);
        setSelectedVendorIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVendorSuggestions])
  // Reset vendor search when form closes
  useEffect(() => {
    if (!showForm) {
      setVendorSearchTerm('');
      setVendorSuggestions([]);
      setShowVendorSuggestions(false);
      setSelectedVendorIndex(-1);
    }
  }, [showForm])
  // Handle vendor form submission
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    setLoadingState('vendorSubmit', true);
    
    const result = editingVendorId 
      ? await updateVendor(editingVendorId, vendorFormData)
      : await createVendor(vendorFormData);

    setLoadingState('vendorSubmit', false);

    if (result.success) {
      showNotification(editingVendorId ? 'Vendor updated!' : 'Vendor created!');
      resetVendorForm();
      loadVendors();
    } else {
      showNotification(result.error, 'error');
    }
  };
  const resetVendorForm = () => {
    setVendorFormData({
      vendorName: '',
      phoneNumber: ''
    });
    setEditingVendorId(null);
    setShowVendorForm(false);
  };


  // View vendor details
  const handleViewVendor = async (vendor) => {
    setLoadingState('loadVendorDetails', true);
    
    const filters = {};
    if (vendorDateFilter !== 'all') {
      const now = new Date();
      switch(vendorDateFilter) {
        case 'today':
          filters.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case 'week':
          filters.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case 'month':
          filters.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
          break;
        case 'custom':
          if (vendorCustomDateRange.startDate && vendorCustomDateRange.endDate) {
            filters.createdAt = {
              $gte: new Date(vendorCustomDateRange.startDate),
              $lte: new Date(vendorCustomDateRange.endDate)
            };
          }
          break;
      }
    }
    
    const result = await getVendorDetails(vendor.vendorName, filters);
    setLoadingState('loadVendorDetails', false);
    
    if (result.success) {
      setSelectedVendorDetails(result.data);
    } else {
      showNotification(result.error, 'error');
    }
  };

  // Load vendor payment history
  const handleViewVendorPaymentHistory = async (vendorName) => {
    setLoadingState('loadVendorPaymentHistory', true);
    
    const filters = { period: vendorDateFilter };
    if (vendorDateFilter === 'custom') {
      filters.startDate = vendorCustomDateRange.startDate;
      filters.endDate = vendorCustomDateRange.endDate;
    }
    
  // Line 3613: Using undefined function
  const result = await getVendorDetails(selectedVendorForHistory.vendorName, filters);
    setLoadingState('loadVendorPaymentHistory', false);
    
    if (result.success) {
      setVendorPaymentHistory(result.data);
      setShowVendorPaymentHistoryModal(true);
    } else {
      showNotification(result.error, 'error');
    }
  };
  // Handle vendor custom date modal
  useEffect(() => {
    if (vendorDateFilter === 'custom' && !vendorCustomDateRange.startDate) {
      setShowVendorCustomDateModal(true);
    }
  }, [vendorDateFilter]);
  // Handle print vendor summary
  const handlePrintVendor = (vendor) => {
    setPrintVendor(vendor);
    setTimeout(() => window.print(), 100);
  };
  // Handle vendor edit
  const handleEditVendor = (vendor) => {
    setVendorFormData({
      vendorName: vendor.vendorName,
      phoneNumber: vendor.phoneNumber
    });
    setEditingVendorId(vendor._id);
    setShowVendorForm(true);
  };

  // Delete vendor
  const handleDeleteVendor = async (id) => {
    if (!confirm('Delete this vendor? This action cannot be undone.')) return;
    
    setLoadingState(`deleteVendor-${id}`, true);
    const result = await deleteVendor(id);
    setLoadingState(`deleteVendor-${id}`, false);

    if (result.success) {
      showNotification('Vendor deleted!');
      loadVendors();
      setShowVendorSidebar(false);
    } else {
      showNotification(result.error, 'error');
    }
  };
    const handleStatusChange = async (id, newStatus) => {
      setLoadingState(`status-${id}`, true);
      const result = await updateGroceryPurchase(id, { status: newStatus });
      setLoadingState(`status-${id}`, false);

      if (result.success) {
        showNotification(`Status updated to ${newStatus}!`);
        loadGroceryData();
      } else {
        showNotification(result.error, 'error');
      }
    };

    const handleOpenReturnModal = (grocery) => {
      setSelectedGroceryForReturn(grocery);
      setReturnData({
        returnQuantity: '',
        returnReason: 'Other',
        returnNotes: ''
      });
      setShowReturnModal(true);
    };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    const returnQty = parseFloat(returnData.returnQuantity);
    
    // CRITICAL FIX: Calculate actual available quantity
    const originalQuantity = Number(selectedGroceryForReturn.quantity);
    const alreadyReturned = Number(selectedGroceryForReturn.returnedQuantity) || 0;
    const currentActualQuantity = originalQuantity - alreadyReturned;
    
    ('Return Debug:', {
      originalQuantity,
      alreadyReturned,
      currentActualQuantity,
      attemptingToReturn: returnQty
    });
    
    if (returnQty <= 0) {
      showNotification('Return quantity must be greater than 0', 'error');
      return;
    }
    
    if (returnQty > currentActualQuantity + 0.01) { // Allow small rounding
      showNotification(
        `Cannot return ${returnQty} ${selectedGroceryForReturn.unit}. Only ${currentActualQuantity.toFixed(2)} ${selectedGroceryForReturn.unit} available.`,
        'error'
      );
      return;
    }

    setLoadingState('return', true);

    const returnRecord = {
      originalPurchaseId: selectedGroceryForReturn._id,
      itemName: selectedGroceryForReturn.itemName,
      category: selectedGroceryForReturn.category,
      returnQuantity: returnQty,
      unit: selectedGroceryForReturn.unit,
      unitPrice: selectedGroceryForReturn.unitPrice || 0,
      returnAmount: returnQty * (selectedGroceryForReturn.unitPrice || 0),
      vendorName: selectedGroceryForReturn.vendorName,
      returnReason: returnData.returnReason,
      returnNotes: returnData.returnNotes,
      returnDate: new Date()
    };

    // CRITICAL FIX: Only update returnedQuantity, NOT the main quantity
    const newReturnedQuantity = alreadyReturned + returnQty;
    const newTotalAmount = Math.max(0, selectedGroceryForReturn.totalAmount - returnRecord.returnAmount);
    
    // Update remaining amount if it's a credit purchase
    let updates = {
      returnedQuantity: newReturnedQuantity,
      totalAmount: newTotalAmount,
      returns: [...(selectedGroceryForReturn.returns || []), returnRecord]
    };
    
    // If credit/bank transfer, adjust remaining amount
    if (selectedGroceryForReturn.paymentMethod === 'CREDIT' || 
        selectedGroceryForReturn.paymentMethod === 'BANK_TRANSFER') {
      const currentPaid = Number(selectedGroceryForReturn.paidAmount) || 0;
      updates.remainingAmount = Math.max(0, newTotalAmount - currentPaid);
    }

    const updateResult = await updateGroceryPurchase(selectedGroceryForReturn._id, updates);

    setLoadingState('return', false);

    if (updateResult.success) {
      showNotification(`Successfully returned ${returnQty} ${selectedGroceryForReturn.unit}!`);
      setShowReturnModal(false);
      setSelectedGroceryForReturn(null);
      loadGroceryData();
      
      // Print return receipt
      setPrintGrocery({ ...returnRecord, isReturn: true });
      setTimeout(() => window.print(), 100);
    } else {
      showNotification(updateResult.error || 'Failed to record return', 'error');
    }
  };

    const handlePrint = (grocery) => {
      setPrintGrocery({ ...grocery, isReturn: false });
      setTimeout(() => window.print(), 100);
    };

    const resetForm = () => {
      setFormData({
        itemName: '',
        category: 'Other',
        quantity: '',
        unit: 'kg',
        unitPrice: '',
        vendorName: '',
        vendorContact: '',
        orderedBy: '',
        orderedByRole: 'Manager',
        totalAmount: '',
        paymentMethod: 'CREDIT',
        status: 'PENDING',
        notes: ''
      });
      setEditingId(null);
      setShowForm(false);
    };
    useEffect(() => {
    if (showVendorSidebar) {
      loadVendors();
    }
  }, [showVendorSidebar, vendorFilterStatus, vendorSortBy, vendorSearchTerm]);

  const filteredGroceries = groceries.filter(g => {
    const matchesSearch = 
      g.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g._id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.invoiceNumber && g.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.orderedBy && g.orderedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.paymentHistory && g.paymentHistory.some(p => 
        p.paidBy?.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
      (g.returns && g.returns.some(r => 
        r.returnReason?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    return matchesSearch;
  });

  // ADD PAGINATION LOGIC
  const displayedGroceries = filteredGroceries.slice(0, displayLimit);
  const totalRecords = filteredGroceries.length;
  const remainingRecords = totalRecords - displayLimit;

    const getStatusColor = (status) => {
      switch(status) {
        case 'PENDING': return 'bg-amber-100 text-amber-700';
        case 'RECEIVED': return 'bg-blue-100 text-blue-700';
        case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
        case 'CANCELLED': return 'bg-red-100 text-red-700';
        default: return 'bg-slate-100 text-slate-700';
      }
    };

    return (
      <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 print:hidden">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
                notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
              } text-white`}
            >
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                    <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                    Grocery Management
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base">Track purchases, vendors & financial control</p>
                </div>
                <div className="flex gap-3">
  {/* Vendors Button */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowVendorSidebar(true)}
      className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
    >
      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
      <span>Vendors</span>
    </motion.button>
    
    {/* View Groceries Button */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSidebarOpen(true)}
      className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
    >
      <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:inline">View Groceries</span>
      <span className="sm:hidden">Groceries</span>
    </motion.button>
    
    {/* Add Purchase Button */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowForm(true)}
      className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
    >
      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:inline">Add Purchase</span>
      <span className="sm:hidden">Add</span>
    </motion.button>
                </div>
              </div>

              {/* Stats Cards */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-l-4 border-emerald-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-xs sm:text-sm mb-1">Today's Spending</p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900">₨{stats?.totalSpent?.toLocaleString() || 0}</p>
                      <p className="text-emerald-600 text-xs sm:text-sm font-medium mt-1">{stats?.totalPurchases || 0} purchases</p>
                    </div>
                    <div className="bg-emerald-100 p-3 sm:p-4 rounded-xl">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-l-4 border-red-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-xs sm:text-sm mb-1">Unpaid Credits</p>
                      <p className="text-2xl sm:text-3xl font-bold text-red-600">₨{unpaidCredit.total.toLocaleString()}</p>
                      <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">{unpaidCredit.count} pending</p>
                    </div>
                    <div className="bg-red-100 p-3 sm:p-4 rounded-xl">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-l-4 border-blue-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-xs sm:text-sm mb-1">Total Items</p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalPurchases || 0}</p>
                      <p className="text-blue-600 text-xs sm:text-sm font-medium mt-1">Completed: {stats?.completedOrders || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 sm:p-4 rounded-xl">
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-l-4 border-purple-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-xs sm:text-sm mb-1">Avg. Order</p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900">₨{stats?.avgOrderValue?.toFixed(0) || 0}</p>
                      <p className="text-purple-600 text-xs sm:text-sm font-medium mt-1">Per Purchase</p>
                    </div>
                    <div className="bg-purple-100 p-3 sm:p-4 rounded-xl">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Analytics Section */}
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Monthly Spending Trend */}
                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Monthly Spending Trend
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value) => `₨${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="totalSpent" stroke="#10b981" strokeWidth={2} name="Total Spent" />
                      <Line type="monotone" dataKey="cashPurchases" stroke="#3b82f6" strokeWidth={2} name="Cash" />
                      <Line type="monotone" dataKey="creditPurchases" stroke="#ef4444" strokeWidth={2} name="Credit" />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-blue-600" />
                      Category Spending (Last 30 Days)
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={categoryData}
                        dataKey="totalSpent"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry._id}: ₨${entry.totalSpent.toFixed(0)}`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₨${value.toLocaleString()}`} />
                    </RePieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Top Vendors */}
                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Top 5 Vendors
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vendorAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="_id" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value) => `₨${value.toLocaleString()}`}
                      />
                      <Bar dataKey="totalSpent" fill="#8b5cf6" name="Total Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Quick Stats */}
                <motion.div variants={cardVariants} className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Quick Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Cash Purchases</span>
                      <span className="text-lg font-bold text-emerald-600">₨{stats?.cashAmount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Credit Purchases</span>
                      <span className="text-lg font-bold text-red-600">₨{stats?.creditAmount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Pending Orders</span>
                      <span className="text-lg font-bold text-blue-600">{stats?.pendingOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Received Orders</span>
                      <span className="text-lg font-bold text-purple-600">{stats?.receivedOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Active Vendors</span>
                      <span className="text-lg font-bold text-amber-600">{vendors.length}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

    {/* Sidebar - Mobile Responsive Version */}
  <AnimatePresence>
    {sidebarOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                  Grocery List
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                  {showArchivedView ? 'Archived Items' : 'Active Purchases'}
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Filters Section */}
            <div className="p-3 sm:p-4 border-b border-slate-200 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items, vendor, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 text-sm"
                />
              </div>

              {/* Filter Dropdowns - Mobile: 2 columns, Tablet+: 4 columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <CustomSelect
                  value={dateFilter}
                  onChange={setDateFilter}
                  options={[
                    { value: 'today', label: 'Today', icon: '📅' },
                    { value: 'week', label: 'Week', icon: '📆' },
                    { value: 'month', label: 'Month', icon: '🗓️' },
                    { value: 'custom', label: 'Custom', icon: '📊' },
                    { value: 'all', label: 'All', icon: '📊' }
                  ]}
                  icon={<Calendar className="w-3 h-3 sm:w-4 sm:h-4" />}
                />

                <CustomSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'ALL', label: 'All', icon: '📋' },
                    { value: 'PENDING', label: 'Pending', icon: '⏳' },
                    { value: 'RECEIVED', label: 'Received', icon: '📦' },
                    { value: 'COMPLETED', label: 'Done', icon: '✅' },
                    { value: 'CANCELLED', label: 'Cancelled', icon: '❌' }
                  ]}
                  icon={<Filter className="w-3 h-3 sm:w-4 sm:h-4" />}
                />

                <CustomSelect
                  value={filterPayment}
                  onChange={setFilterPayment}
                  options={[
                    { value: 'ALL', label: 'All', icon: '💰' },
                    { value: 'CASH', label: 'Cash', icon: '💵' },
                    { value: 'CREDIT', label: 'Credit', icon: '💳' },
                    { value: 'BANK_TRANSFER', label: 'Bank', icon: '🏦' }
                  ]}
                  icon={<DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />}
                />

                <CustomSelect
                  value={filterCategory}
                  onChange={setFilterCategory}
                  options={[
                    { value: 'ALL', label: 'All', icon: '🛒' },
                    ...categories.map(cat => ({ 
                      value: cat, 
                      label: cat, 
                      icon: getCategoryIcon(cat)
                    }))
                  ]}
                  icon={<Package className="w-3 h-3 sm:w-4 sm:h-4" />}
                />
              </div>

              {/* Custom Date Range Display */}
              {dateFilter === 'custom' && customDateRange.startDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm text-slate-700 flex-1 min-w-0">
                      <span className="font-semibold">Range: </span>
                      <span className="block sm:inline">
                        {new Date(customDateRange.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                        {' - '}
                        {new Date(customDateRange.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCustomDateRange({ startDate: '', endDate: '' });
                        setDateFilter('today');
                      }}
                      className="p-1 hover:bg-blue-200 rounded text-blue-700 flex-shrink-0"
                      title="Clear custom range"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowArchivedView(!showArchivedView)}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{showArchivedView ? 'Active' : 'Archived'}</span>
                  <span className="xs:hidden">{showArchivedView ? 'Active' : 'Archive'}</span>
                </button>
                <button
                  onClick={loadGroceryData}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-emerald-600 mb-4"></div>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">Loading...</p>
                </div>
              ) : displayedGroceries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Package className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium text-base sm:text-lg">No groceries found</p>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {displayedGroceries.map((grocery) => (
                    <motion.div 
                      key={grocery._id} 
                      variants={itemVariants}
                      className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
                    >
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 sm:gap-3 mb-2">
                            <span className="text-2xl sm:text-3xl flex-shrink-0">{getCategoryIcon(grocery.category)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 text-base sm:text-xl truncate">{grocery.itemName}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-1">
                                <span className="flex items-center gap-1.5 truncate">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{grocery.vendorName}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  {new Date(grocery.orderDate || grocery.createdAt).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(grocery.status)}`}>
                            {grocery.status}
                          </span>
                          {grocery.paymentMethod === 'CREDIT' && grocery.remainingAmount > 0 && (
                            <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Credit
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Quantity
                          </p>
                          <p className="font-bold text-slate-900 text-base sm:text-lg">
                            {grocery.quantity} {grocery.unit}
                          </p>
                          {grocery.returnedQuantity > 0 && (
                            <>
                              <span className="text-red-600 text-xs block mt-1">
                                Returned: {grocery.returnedQuantity} {grocery.unit}
                              </span>
                              <span className="text-emerald-600 text-xs font-semibold block">
                                Net: {(grocery.quantity - grocery.returnedQuantity).toFixed(2)} {grocery.unit}
                              </span>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Total Amount
                          </p>
                          <p className="font-bold text-emerald-600 text-lg sm:text-2xl">₨{grocery.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Credit Payment Info */}
                      {grocery.paymentMethod === 'CREDIT' && grocery.remainingAmount > 0 && (
                        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                            <span className="text-slate-700 flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                              Paid: <span className="font-semibold">₨{grocery.paidAmount?.toFixed(2) || 0}</span>
                            </span>
                            <span className="text-red-600 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Due: ₨{grocery.remainingAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Section */}
                      <div className="space-y-2 sm:space-y-3">
                        {/* Primary Actions Row */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setViewDetails(grocery)}
                            className="flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg sm:rounded-xl hover:bg-purple-700 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">View Details</span>
                            <span className="xs:hidden">View</span>
                          </button>

                          {(grocery.paymentMethod === 'CREDIT' || grocery.paymentMethod === 'BANK_TRANSFER') && 
                          grocery.paymentHistory && grocery.paymentHistory.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedGroceryForHistory(grocery);
                                setShowPaymentHistoryModal(true);
                              }}
                              className="flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Payment History</span>
                              <span className="sm:hidden">Payments</span>
                            </button>
                          )}

                          {grocery.returns && grocery.returns.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedGroceryForReturnHistory(grocery);
                                setShowReturnHistoryModal(true);
                              }}
                              className="flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 text-white rounded-lg sm:rounded-xl hover:bg-orange-700 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Return History</span>
                              <span className="sm:hidden">Returns</span>
                            </button>
                          )}
                        </div>

                        {/* Status Workflow Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {grocery.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(grocery._id, 'RECEIVED')}
                              disabled={actionLoading[`status-${grocery._id}`]}
                              className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Mark as Received</span>
                              <span className="sm:hidden">Received</span>
                            </button>
                          )}
                          
                          {grocery.status === 'RECEIVED' && (
                            <button
                              onClick={() => handleStatusChange(grocery._id, 'COMPLETED')}
                              disabled={actionLoading[`status-${grocery._id}`]}
                              className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm"
                            >
                              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Complete Order</span>
                              <span className="sm:hidden">Complete</span>
                            </button>
                          )}
                          
                          {(grocery.status === 'PENDING' || grocery.status === 'RECEIVED') && (
                            <button
                              onClick={() => handleStatusChange(grocery._id, 'CANCELLED')}
                              disabled={actionLoading[`status-${grocery._id}`]}
                              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm"
                            >
                              <XSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>

                        {/* Secondary Actions Row */}
                        <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-200">
                          {(grocery.paymentMethod === 'CREDIT' || grocery.paymentMethod === 'BANK_TRANSFER') && 
                          grocery.remainingAmount > 0 && 
                          grocery.status === 'RECEIVED' &&
                          grocery.status !== 'CANCELLED' && 
                          !actionLoading[`payment-${grocery._id}`] && (
                            <button
                              onClick={() => handleOpenPaymentModal(grocery)}
                              disabled={actionLoading[`payment-${grocery._id}`]}
                              className="flex-1 min-w-[90px] px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                            >
                              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Record Payment</span>
                              <span className="xs:hidden">Pay</span>
                            </button>
                          )}

                          {!showArchivedView && 
                          grocery.status !== 'COMPLETED' && 
                          grocery.status !== 'CANCELLED' && 
                          grocery.status === 'RECEIVED' && (
                            <button
                              onClick={() => handleOpenReturnModal(grocery)}
                              disabled={actionLoading[`return-${grocery._id}`]}
                              className="flex-1 min-w-[90px] px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Return</span>
                            </button>
                          )}

                          {grocery.status !== 'COMPLETED' && grocery.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleEdit(grocery)}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Edit</span>
                            </button>
                          )}

                          <button
                            onClick={() => handlePrint(grocery)}
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Print</span>
                          </button>

                          {!showArchivedView ? (
                            <button
                              onClick={() => handleArchive(grocery._id)}
                              disabled={actionLoading[`archive-${grocery._id}`]}
                              className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading[`archive-${grocery._id}`] ? (
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <>
                                  <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Archive</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(grocery._id)}
                              disabled={actionLoading[`restore-${grocery._id}`]}
                              className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading[`restore-${grocery._id}`] ? (
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Restore</span>
                                </>
                              )}
                            </button>
                          )}

                          {grocery.status !== 'COMPLETED' && 
                          grocery.status !== 'CANCELLED' &&
                          grocery.status !== 'RECEIVED' && (
                            <button
                              onClick={() => handleDelete(grocery._id)}
                              disabled={actionLoading[`delete-${grocery._id}`]}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
                            >
                              {actionLoading[`delete-${grocery._id}`] ? (
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Load More Button */}
                  {remainingRecords > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-3 py-4 sm:py-6"
                    >
                      <div className="text-center">
                        <p className="text-slate-600 font-medium mb-1 text-sm sm:text-base">
                          Showing {displayedGroceries.length} of {totalRecords} records
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          {remainingRecords} more record{remainingRecords !== 1 ? 's' : ''} available
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setLoadingMore(true);
                          setTimeout(() => {
                            setDisplayLimit(prev => prev + 50);
                            setLoadingMore(false);
                          }, 300);
                        }}
                        disabled={loadingMore}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loadingMore ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        <span className="hidden xs:inline">{loadingMore ? 'Loading...' : 'Load 50 More Records'}</span>
                        <span className="xs:hidden">{loadingMore ? 'Loading...' : 'Load More'}</span>
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
  {/* Add/Edit Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {showForm && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]"
        onClick={() => !editingId && !actionLoading.submit && resetForm()}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
                <span className="truncate">{editingId ? 'Edit Purchase' : 'New Purchase'}</span>
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 truncate">
                {editingId ? 'Update purchase details' : 'Add a new grocery purchase'}
              </p>
            </div>
            <button
              onClick={resetForm}
              disabled={actionLoading.submit}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto flex-1 p-3 sm:p-4 md:p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                
                {/* Item Name - Full Width */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.itemName}
                    onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                    placeholder="e.g., Fresh Chicken"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    🏷️ Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity & Unit */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    📊 Quantity & Unit *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                      placeholder="10"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="px-2 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base min-w-[70px]"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    💵 Unit Price (₨)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                    placeholder="Leave empty if unknown"
                  />
                  <p className="text-xs text-slate-500 mt-1 hidden sm:block">Optional - leave blank for manual entry on bill</p>
                </div>

                {/* Total Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    💰 Total Amount (₨) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 text-sm sm:text-base"
                    placeholder="Leave empty if unknown"
                  />
                  <p className="text-xs text-slate-500 mt-1 hidden sm:block">Auto-calculated if unit price is set</p>
                </div>
  {/* Vendor Name with Smart Search */}
  <div className="relative">
    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
      Vendor Name *
    </label>
    
    <div className="relative">
      <input
        ref={vendorInputRef}
        type="text"
        required
        value={vendorSearchTerm || formData.vendorName}
        onChange={(e) => handleVendorSearch(e.target.value)}
        onFocus={() => vendorSuggestions.length > 0 && setShowVendorSuggestions(true)}
        onKeyDown={(e) => {
          if (!showVendorSuggestions || vendorSuggestions.length === 0) return

          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault()
              setSelectedVendorIndex(prev => 
                prev < vendorSuggestions.length - 1 ? prev + 1 : prev
              )
              break
            case 'ArrowUp':
              e.preventDefault()
              setSelectedVendorIndex(prev => prev > 0 ? prev - 1 : -1)
              break
            case 'Enter':
              e.preventDefault()
              if (selectedVendorIndex >= 0 && vendorSuggestions[selectedVendorIndex]) {
                handleSelectVendor(vendorSuggestions[selectedVendorIndex])
              }
              break
            case 'Escape':
              e.preventDefault()
              setShowVendorSuggestions(false)
              setSelectedVendorIndex(-1)
              break
          }
        }}
        disabled={actionLoading.submit}
        placeholder="Start typing vendor name..."
        className="w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 text-slate-900 text-sm sm:text-base"
      />
      
      {/* Loading spinner */}
      {actionLoading.vendorSearch && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />
      )}
      
      {/* Clear button */}
      {!actionLoading.vendorSearch && formData.vendorName && (
        <button
          type="button"
          onClick={() => {
            setShowVendorSuggestions(false)
            setFormData(prev => ({ 
              ...prev, 
              vendorName: '', 
              vendorContact: '' 
            }))
            setVendorSearchTerm('')
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Vendor Search Dropdown */}
    <AnimatePresence>
      {showVendorSuggestions && vendorSuggestions.length > 0 && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowVendorSuggestions(false)}
          />
          
          <motion.div
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
                  {vendorSuggestions.length} vendor{vendorSuggestions.length > 1 ? 's' : ''} found
                </span>
              </div>
              
              {/* Vendor results */}
              {vendorSuggestions.map((vendor, index) => (
                <motion.button
                  key={vendor._id}
                  type="button"
                  onClick={() => handleSelectVendor(vendor)}
                  onMouseEnter={() => setSelectedVendorIndex(index)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                    selectedVendorIndex === index
                      ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md'
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  {/* Vendor Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {vendor.vendorName?.charAt(0)?.toUpperCase() || 'V'}
                  </div>
                  
                  {/* Vendor Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {vendor.vendorName}
                      </p>
                      {vendor.totalOrders > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {vendor.totalOrders}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs text-slate-600 font-medium">
                        {vendor.phoneNumber}
                      </p>
                    </div>
                    
                    {vendor.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {vendor.address}
                        </p>
                      </div>
                    )}
                    
                    {vendor.totalPending > 0 && (
                      <div className="mt-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded inline-block">
                        <p className="text-xs text-red-600 font-bold">
                          Pending: ₨{vendor.totalPending.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 transition-opacity ${
                    selectedVendorIndex === index ? 'opacity-100 text-emerald-500' : 'opacity-0'
                  }`} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Helper text */}
    {!formData.vendorName && (
      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
        <Info className="w-3 h-3" />
        Type to search existing vendors or create new
      </p>
    )}
  </div>

  {/* Vendor Contact - Auto-filled */}
  <div>
    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
      Vendor Contact
    </label>
    <input
      type="tel"
      value={formData.vendorContact}
      onChange={(e) => setFormData(prev => ({ ...prev, vendorContact: e.target.value }))}
      disabled={actionLoading.submit}
      placeholder="Will auto-fill from vendor"
      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base disabled:opacity-50"
    />
  </div>

                {/* Ordered By */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    👤 Ordered By *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.orderedBy}
                    onChange={(e) => setFormData({...formData, orderedBy: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                    placeholder="Person name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    🎭 Role *
                  </label>
                  <select
                    value={formData.orderedByRole}
                    onChange={(e) => setFormData({...formData, orderedByRole: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    💳 Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                  >
                    <option value="CREDIT">💳 Credit</option>
                    <option value="CASH">💵 Cash</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                    <option value="CHEQUE">📝 Cheque</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    📋 Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base"
                  >
                    <option value="PENDING">⏳ Pending</option>
                    <option value="RECEIVED">📦 Received</option>
                    <option value="COMPLETED">✅ Completed</option>
                    <option value="CANCELLED">❌ Cancelled</option>
                  </select>
                </div>

                {/* Notes - Full Width */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                    📝 Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-slate-900 text-sm sm:text-base"
                    placeholder="Additional notes, special instructions, or remarks..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  type="submit"
                  disabled={actionLoading.submit}
                  className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {actionLoading.submit ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{editingId ? 'Update Purchase' : 'Add Purchase'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={actionLoading.submit}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

    {/* Return Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {showReturnModal && selectedGroceryForReturn && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => !actionLoading.return && setShowReturnModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Return Item</span>
              </h2>
              <p className="text-orange-100 text-xs sm:text-sm mt-1 truncate">Record item return to vendor</p>
            </div>
            <button
              onClick={() => setShowReturnModal(false)}
              disabled={actionLoading.return}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1">
            {/* Item Summary Card */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3 mb-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0">{getCategoryIcon(selectedGroceryForReturn.category)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 truncate">{selectedGroceryForReturn.itemName}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm truncate">Vendor: {selectedGroceryForReturn.vendorName}</p>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Purchased</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {selectedGroceryForReturn.quantity} <span className="text-xs">{selectedGroceryForReturn.unit}</span>
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Returned</p>
                  <p className="font-bold text-red-600 text-sm sm:text-base truncate">
                    {selectedGroceryForReturn.returnedQuantity || 0} <span className="text-xs">{selectedGroceryForReturn.unit}</span>
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Available</p>
                  <p className="font-bold text-emerald-600 text-sm sm:text-base truncate">
                    {(selectedGroceryForReturn.quantity - (selectedGroceryForReturn.returnedQuantity || 0)).toFixed(2)} <span className="text-xs">{selectedGroceryForReturn.unit}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Return Form */}
            <form onSubmit={handleReturnSubmit}>
              <div className="space-y-3 sm:space-y-4">
                {/* Return Quantity */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Return Quantity ({selectedGroceryForReturn.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    max={selectedGroceryForReturn.quantity - (selectedGroceryForReturn.returnedQuantity || 0)}
                    value={returnData.returnQuantity}
                    onChange={(e) => setReturnData({...returnData, returnQuantity: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm sm:text-base"
                    placeholder="Enter quantity to return"
                  />
                </div>

                {/* Return Reason */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Return Reason *
                  </label>
                  <select
                    value={returnData.returnReason}
                    onChange={(e) => setReturnData({...returnData, returnReason: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm sm:text-base"
                  >
                    <option value="Other">Other</option>
                    <option value="Quality Issue">Quality Issue</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Expired">Expired</option>
                    <option value="Excess Quantity">Excess Quantity</option>
                    <option value="Not as Described">Not as Described</option>
                  </select>
                </div>

                {/* Return Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Return Notes
                  </label>
                  <textarea
                    value={returnData.returnNotes}
                    onChange={(e) => setReturnData({...returnData, returnNotes: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-slate-900 text-sm sm:text-base"
                    placeholder="Additional details about the return..."
                  />
                </div>

                {/* Return Amount Display */}
                {returnData.returnQuantity && selectedGroceryForReturn.unitPrice && (
                  <div className="bg-orange-50 border border-orange-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-700 font-medium text-sm sm:text-base">Return Amount:</span>
                      <span className="text-xl sm:text-2xl font-bold text-orange-600">
                        ₨{(parseFloat(returnData.returnQuantity) * selectedGroceryForReturn.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  type="submit"
                  disabled={actionLoading.return}
                  className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {actionLoading.return ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden xs:inline">Processing Return...</span>
                      <span className="xs:hidden">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Process Return</span>
                      <span className="xs:hidden">Return</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  disabled={actionLoading.return}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Payment Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {showPaymentModal && selectedGroceryForPayment && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => !actionLoading.payment && setShowPaymentModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Record Payment</span>
              </h2>
              <p className="text-green-100 text-xs sm:text-sm mt-1 truncate">Process credit/bank transfer payment</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={actionLoading.payment}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1">
            {/* Payment Summary Card */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3 mb-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0">{getCategoryIcon(selectedGroceryForPayment.category)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 truncate">{selectedGroceryForPayment.itemName}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm truncate">Vendor: {selectedGroceryForPayment.vendorName}</p>
                </div>
              </div>
              
              {/* Payment Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Total Amount</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base break-words">
                    ₨{selectedGroceryForPayment.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Already Paid</p>
                  <p className="font-bold text-green-600 text-sm sm:text-base break-words">
                    ₨{(selectedGroceryForPayment.paidAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Remaining</p>
                  <p className="font-bold text-red-600 text-sm sm:text-base break-words">
                    ₨{selectedGroceryForPayment.remainingAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-3 sm:space-y-4">
                {/* Payment Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Payment Amount (₨) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    max={selectedGroceryForPayment.remainingAmount}
                    value={paymentData.paymentAmount}
                    onChange={(e) => setPaymentData({...paymentData, paymentAmount: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 text-base sm:text-lg font-bold"
                    placeholder="Enter payment amount"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum: ₨{selectedGroceryForPayment.remainingAmount.toFixed(2)}</p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 text-sm sm:text-base"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                    <option value="CHEQUE">📝 Cheque</option>
                  </select>
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    👤 Paid By *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.paidBy}
                    onChange={(e) => setPaymentData({...paymentData, paidBy: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 text-sm sm:text-base"
                    placeholder="e.g., Owner, Manager"
                  />
                </div>

                {/* Payment Note */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Payment Note (Optional)
                  </label>
                  <textarea
                    value={paymentData.paymentNote}
                    onChange={(e) => setPaymentData({...paymentData, paymentNote: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-slate-900 text-sm sm:text-base"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                {/* Payment Summary */}
                {paymentData.paymentAmount && (
                  <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-700 font-medium text-xs sm:text-sm">New Paid Amount:</span>
                        <span className="text-base sm:text-lg font-bold text-green-600 break-words">
                          ₨{((selectedGroceryForPayment.paidAmount || 0) + parseFloat(paymentData.paymentAmount || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-700 font-medium text-xs sm:text-sm">New Remaining:</span>
                        <span className="text-base sm:text-lg font-bold text-red-600 break-words">
                          ₨{(selectedGroceryForPayment.remainingAmount - parseFloat(paymentData.paymentAmount || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  type="submit"
                  disabled={actionLoading.payment}
                  className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {actionLoading.payment ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden xs:inline">Processing Payment...</span>
                      <span className="xs:hidden">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Record Payment</span>
                      <span className="xs:hidden">Record</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={actionLoading.payment}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Payment History Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {showPaymentHistoryModal && selectedGroceryForHistory && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => setShowPaymentHistoryModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Payment History</span>
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm mt-1 truncate">{selectedGroceryForHistory.itemName}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setPrintGrocery({ 
                    ...selectedGroceryForHistory, 
                    isPaymentHistory: true 
                  });
                  setTimeout(() => window.print(), 100);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                title="Print Payment History"
              >
                <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setShowPaymentHistoryModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">{getCategoryIcon(selectedGroceryForHistory.category)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{selectedGroceryForHistory.itemName}</h3>
                  <p className="text-slate-600 text-sm sm:text-base truncate">Vendor: {selectedGroceryForHistory.vendorName}</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-xs text-slate-600">Order Date</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">
                    {new Date(selectedGroceryForHistory.orderDate || selectedGroceryForHistory.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Amount Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-xs text-slate-600 mb-1">Total Amount</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 break-words">₨{selectedGroceryForHistory.totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-green-500">
                  <p className="text-xs text-slate-600 mb-1">Total Paid</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 break-words">₨{(selectedGroceryForHistory.paidAmount || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-red-500">
                  <p className="text-xs text-slate-600 mb-1">Remaining</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-red-600 break-words">₨{selectedGroceryForHistory.remainingAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span className="truncate">Payment Timeline ({selectedGroceryForHistory.paymentHistory.length} Transactions)</span>
              </h3>

              {selectedGroceryForHistory.paymentHistory.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-lg sm:rounded-xl">
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium text-sm sm:text-base">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedGroceryForHistory.paymentHistory.map((payment, index) => {
                    const runningPaid = selectedGroceryForHistory.paymentHistory
                      .slice(0, index + 1)
                      .reduce((sum, p) => sum + p.amount, 0);
                    const runningRemaining = selectedGroceryForHistory.totalAmount - runningPaid;

                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:shadow-lg transition-all"
                      >
                        {/* Payment Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="bg-indigo-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xl sm:text-2xl font-bold text-indigo-600 break-words">₨{payment.amount.toFixed(2)}</p>
                              <p className="text-xs sm:text-sm text-slate-600 truncate">
                                {new Date(payment.date).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="flex-1 sm:flex-none inline-block px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold whitespace-nowrap">
                              Payment #{index + 1}
                            </span>
                            {/* Reprint Button */}
                            <button
                              onClick={() => {
                                setPrintGrocery({
                                  ...selectedGroceryForHistory,
                                  paymentAmount: payment.amount,
                                  paymentMethod: payment.method,
                                  paymentNote: payment.note,
                                  paidBy: payment.paidBy,
                                  paymentDate: payment.date,
                                  newPaidAmount: runningPaid,
                                  newRemainingAmount: runningRemaining,
                                  isPaymentReceipt: true
                                });
                                setTimeout(() => window.print(), 100);
                              }}
                              className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-all flex-shrink-0"
                              title="Reprint Payment Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                            <p className="text-xs text-slate-600 mb-1">Method</p>
                            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{payment.method}</p>
                          </div>
                          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                            <p className="text-xs text-slate-600 mb-1">Paid By</p>
                            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{payment.paidBy || 'Unknown'}</p>
                          </div>
                        </div>

                        {/* Payment Note */}
                        {payment.note && (
                          <div className="bg-blue-50 border border-blue-200 p-2 sm:p-3 rounded-lg mb-3">
                            <p className="text-xs text-slate-600 mb-1">Note:</p>
                            <p className="text-xs sm:text-sm text-slate-700 break-words">{payment.note}</p>
                          </div>
                        )}

                        {/* Running Totals */}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-200 gap-2">
                          <div>
                            <p className="text-xs text-slate-600">Total Paid So Far</p>
                            <p className="font-bold text-green-600 text-sm sm:text-base break-words">₨{runningPaid.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600">Remaining After</p>
                            <p className="font-bold text-red-600 text-sm sm:text-base break-words">₨{Math.max(0, runningRemaining).toFixed(2)}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="mt-4 sm:mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Payment Status</p>
                  <p className={`text-lg sm:text-xl font-bold ${
                    selectedGroceryForHistory.creditStatus === 'PAID' ? 'text-green-600' :
                    selectedGroceryForHistory.creditStatus === 'PARTIAL' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {selectedGroceryForHistory.creditStatus === 'PAID' ? '✓ Fully Paid' :
                    selectedGroceryForHistory.creditStatus === 'PARTIAL' ? '◐ Partially Paid' :
                    '✗ Unpaid'}
                  </p>
                </div>
                {selectedGroceryForHistory.remainingAmount > 0 && (
                  <button
                    onClick={() => {
                      setShowPaymentHistoryModal(false);
                      handleOpenPaymentModal(selectedGroceryForHistory);
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Add Payment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Custom Date Range Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {showCustomDateModal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => {
          setShowCustomDateModal(false);
          if (!customDateRange.startDate) {
            setDateFilter('today');
          }
        }}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Custom Date Range</span>
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">Select date range</p>
            </div>
            <button
              onClick={() => {
                setShowCustomDateModal(false);
                if (!customDateRange.startDate) {
                  setDateFilter('today');
                }
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                  max={customDateRange.endDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm sm:text-base"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                  min={customDateRange.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm sm:text-base"
                />
              </div>

              {/* Date Range Preview */}
              {customDateRange.startDate && customDateRange.endDate && (
                <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-slate-700">
                    <span className="font-semibold">Range: </span>
                    <span className="block sm:inline mt-1 sm:mt-0">
                      {new Date(customDateRange.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {' → '}
                      {new Date(customDateRange.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  if (customDateRange.startDate && customDateRange.endDate) {
                    setShowCustomDateModal(false);
                    loadGroceryData();
                  } else {
                    showNotification('Please select both start and end dates', 'error');
                  }
                }}
                disabled={!customDateRange.startDate || !customDateRange.endDate}
                className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Apply Range</span>
              </button>
              <button
                onClick={() => {
                  setShowCustomDateModal(false);
                  setDateFilter('today');
                  setCustomDateRange({ startDate: '', endDate: '' });
                }}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Return History Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {showReturnHistoryModal && selectedGroceryForReturnHistory && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => setShowReturnHistoryModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Return History</span>
              </h2>
              <p className="text-orange-100 text-xs sm:text-sm mt-1 truncate">{selectedGroceryForReturnHistory.itemName}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setPrintGrocery({ 
                    ...selectedGroceryForReturnHistory, 
                    isReturnHistory: true 
                  });
                  setTimeout(() => window.print(), 100);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                title="Print Return History"
              >
                <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setShowReturnHistoryModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">{getCategoryIcon(selectedGroceryForReturnHistory.category)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{selectedGroceryForReturnHistory.itemName}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm truncate">Purchase ID: {selectedGroceryForReturnHistory._id?.slice(-8).toUpperCase()}</p>
                  <p className="text-slate-600 text-xs sm:text-sm truncate">Vendor: {selectedGroceryForReturnHistory.vendorName}</p>
                </div>
              </div>

              {/* Quantity Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-xs text-slate-600 mb-1">Original Qty</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 break-words">
                    {selectedGroceryForReturnHistory.quantity} <span className="text-xs">{selectedGroceryForReturnHistory.unit}</span>
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-red-500">
                  <p className="text-xs text-slate-600 mb-1">Returned</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-red-600 break-words">
                    {selectedGroceryForReturnHistory.returnedQuantity || 0} <span className="text-xs">{selectedGroceryForReturnHistory.unit}</span>
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-green-500">
                  <p className="text-xs text-slate-600 mb-1">Net Qty</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 break-words">
                    {(selectedGroceryForReturnHistory.quantity - (selectedGroceryForReturnHistory.returnedQuantity || 0)).toFixed(2)} <span className="text-xs">{selectedGroceryForReturnHistory.unit}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Return Timeline */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                <span className="truncate">Return Timeline ({selectedGroceryForReturnHistory.returns?.length || 0} Returns)</span>
              </h3>

              {!selectedGroceryForReturnHistory.returns || selectedGroceryForReturnHistory.returns.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-lg sm:rounded-xl">
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium text-sm sm:text-base">No returns recorded</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedGroceryForReturnHistory.returns.map((returnItem, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border-2 border-orange-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:shadow-lg transition-all"
                    >
                      {/* Return Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="bg-orange-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-orange-600 break-words">
                              {returnItem.returnQuantity} <span className="text-base">{returnItem.unit}</span>
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 truncate">
                              {new Date(returnItem.returnDate).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="flex-1 sm:flex-none inline-block px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold whitespace-nowrap">
                            Return #{index + 1}
                          </span>
                          <button
                            onClick={() => {
                              setPrintGrocery({ 
                                ...returnItem, 
                                isReturn: true,
                                purchaseId: selectedGroceryForReturnHistory._id,
                                originalQuantity: selectedGroceryForReturnHistory.quantity
                              });
                              setTimeout(() => window.print(), 100);
                            }}
                            className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all flex-shrink-0"
                            title="Print Return Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Return Details */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                        <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">Reason</p>
                          <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{returnItem.returnReason}</p>
                        </div>
                        <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">Return Amount</p>
                          <p className="font-bold text-orange-600 text-sm sm:text-base break-words">₨{returnItem.returnAmount?.toFixed(2) || 0}</p>
                        </div>
                      </div>

                      {/* Return Notes */}
                      {returnItem.returnNotes && (
                        <div className="bg-orange-50 border border-orange-200 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">Notes:</p>
                          <p className="text-xs sm:text-sm text-slate-700 break-words">{returnItem.returnNotes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
    {/* View Details Modal - Mobile Responsive Version */}
  <AnimatePresence>
    {viewDetails && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]"
        onClick={() => setViewDetails(null)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Purchase Details</span>
              </h2>
              <p className="text-purple-100 text-xs sm:text-sm mt-1 truncate">Complete information</p>
            </div>
            <button
              onClick={() => setViewDetails(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Item Summary Card */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 sm:p-4 rounded-lg sm:rounded-xl">
              <div className="flex items-start gap-2 sm:gap-3 mb-3">
                <span className="text-3xl sm:text-4xl flex-shrink-0">{getCategoryIcon(viewDetails.category)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{viewDetails.itemName}</h3>
                  <p className="text-slate-600 text-sm sm:text-base truncate">{viewDetails.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Quantity</p>
                  <p className="font-bold text-slate-900 text-base sm:text-lg break-words">{viewDetails.quantity} {viewDetails.unit}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Unit Price</p>
                  <p className="font-bold text-slate-900 text-base sm:text-lg break-words">{viewDetails.unitPrice ? `₨${viewDetails.unitPrice}` : '________'}</p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                Financial Details
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <InfoCard label="Total Amount" value={`₨${viewDetails.totalAmount.toFixed(2)}`} color="emerald" />
                <InfoCard label="Payment Method" value={viewDetails.paymentMethod} color="blue" />
                {viewDetails.paymentMethod === 'CREDIT' && (
                  <>
                    <InfoCard label="Paid Amount" value={`₨${viewDetails.paidAmount?.toFixed(2) || 0}`} color="green" />
                    <InfoCard label="Remaining" value={`₨${viewDetails.remainingAmount.toFixed(2)}`} color="red" />
                  </>
                )}
              </div>
            </div>

            {/* Vendor Details */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Vendor Details
              </h4>
              <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl space-y-2">
                <div className="flex flex-col xs:flex-row xs:justify-between gap-1">
                  <span className="text-slate-600 text-xs sm:text-sm">Vendor Name:</span>
                  <span className="font-semibold text-slate-900 text-sm sm:text-base break-words">{viewDetails.vendorName}</span>
                </div>
                {viewDetails.vendorContact && (
                  <div className="flex flex-col xs:flex-row xs:justify-between gap-1">
                    <span className="text-slate-600 text-xs sm:text-sm">Contact:</span>
                    <span className="font-semibold text-slate-900 text-sm sm:text-base break-words">{viewDetails.vendorContact}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Order Details
              </h4>
              <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl space-y-2">
                <div className="flex flex-col xs:flex-row xs:justify-between gap-1">
                  <span className="text-slate-600 text-xs sm:text-sm">Ordered By:</span>
                  <span className="font-semibold text-slate-900 text-sm sm:text-base break-words">
                    {viewDetails.orderedBy} ({viewDetails.orderedByRole})
                  </span>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-between gap-1">
                  <span className="text-slate-600 text-xs sm:text-sm">Order Date:</span>
                  <span className="font-semibold text-slate-900 text-sm sm:text-base break-words">
                    {new Date(viewDetails.orderDate || viewDetails.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1">
                  <span className="text-slate-600 text-xs sm:text-sm">Status:</span>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold self-start xs:self-auto ${getStatusColor(viewDetails.status)}`}>
                    {viewDetails.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Return Information */}
            {viewDetails.returnedQuantity > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  Return Information
                </h4>
                <div className="bg-orange-50 border border-orange-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1">
                    <span className="text-slate-700 text-xs sm:text-sm">Returned Quantity:</span>
                    <span className="font-bold text-orange-600 text-base sm:text-lg break-words">
                      {viewDetails.returnedQuantity} {viewDetails.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {viewDetails.notes && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  📝 Notes
                </h4>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-slate-700 text-sm sm:text-base break-words">{viewDetails.notes}</p>
                </div>
              </div>
            )}

            {/* Payment History */}
            {viewDetails.paymentHistory && viewDetails.paymentHistory.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  💰 Payment History
                </h4>
                <div className="space-y-2">
                  {viewDetails.paymentHistory.map((payment, index) => (
                    <div key={index} className="bg-slate-50 p-2 sm:p-3 rounded-lg flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm sm:text-base break-words">₨{payment.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-600 truncate">
                          {new Date(payment.date).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-600 self-start xs:self-auto">{payment.method}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return History */}
            {viewDetails.returns && viewDetails.returns.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  Return History
                </h4>
                <div className="space-y-2">
                  {viewDetails.returns.map((ret, index) => (
                    <div key={index} className="bg-orange-50 border border-orange-200 p-2 sm:p-3 rounded-lg">
                      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base break-words">
                            {ret.returnQuantity} {ret.unit} - ₨{ret.returnAmount?.toFixed(2) || 0}
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {new Date(ret.returnDate).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                        <span className="text-xs bg-orange-100 px-2 py-1 rounded self-start whitespace-nowrap">
                          {ret.returnReason}
                        </span>
                      </div>
                      {ret.returnNotes && (
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 break-words">{ret.returnNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
      </div>

  {/* Vendor Sidebar - Matches Grocery Sidebar */}
  <AnimatePresence>
    {showVendorSidebar && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowVendorSidebar(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      <motion.div
    initial={{ x: '-100%' }}
    animate={{ x: 0 }}
    exit={{ x: '-100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-y-0 left-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50"
  >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  Vendor Management
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Manage suppliers & payments
                </p>
              </div>
              <button
                onClick={() => setShowVendorSidebar(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Filters Section */}
            <div className="p-3 sm:p-4 border-b border-slate-200 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name or phone..."
                  value={vendorSearchTerm}
                  onChange={(e) => setVendorSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <CustomSelect
                  value={vendorDateFilter}
                  onChange={setVendorDateFilter}
                  options={[
                    { value: 'all', label: 'All Time', icon: '📊' },
                    { value: 'today', label: 'Today', icon: '📅' },
                    { value: 'week', label: 'Week', icon: '📆' },
                    { value: 'month', label: 'Month', icon: '🗓️' },
                    { value: 'custom', label: 'Custom', icon: '📊' }
                  ]}
                  icon={<Calendar className="w-3 h-3 sm:w-4 sm:h-4" />}
                />

                <CustomSelect
                  value={vendorFilterStatus}
                  onChange={setVendorFilterStatus}
                  options={[
                    { value: 'ALL', label: 'All', icon: '📋' },
                    { value: 'WITH_PENDING', label: 'Has Pending', icon: '💳' },
                    { value: 'FULLY_PAID', label: 'Fully Paid', icon: '✅' },
                    { value: 'ACTIVE', label: 'Active', icon: '🟢' },
                    { value: 'INACTIVE', label: 'Inactive', icon: '🔴' }
                  ]}
                  icon={<Filter className="w-3 h-3 sm:w-4 sm:h-4" />}
                />

                <CustomSelect
                  value={vendorSortBy}
                  onChange={setVendorSortBy}
                  options={[
                    { value: 'name', label: 'Name', icon: '🔤' },
                    { value: 'pending', label: 'Pending', icon: '💰' },
                    { value: 'orders', label: 'Orders', icon: '📦' },
                    { value: 'recent', label: 'Recent', icon: '🕒' }
                  ]}
                  icon={<BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />}
                />
              </div>

              {/* Custom Date Range Display */}
              {vendorDateFilter === 'custom' && vendorCustomDateRange.startDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm text-slate-700 flex-1 min-w-0">
                      <span className="font-semibold">Range: </span>
                      <span className="block sm:inline">
                        {new Date(vendorCustomDateRange.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                        {' - '}
                        {new Date(vendorCustomDateRange.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setVendorCustomDateRange({ startDate: '', endDate: '' });
                        setVendorDateFilter('all');
                      }}
                      className="p-1 hover:bg-blue-200 rounded text-blue-700 flex-shrink-0"
                      title="Clear custom range"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowVendorForm(true)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Add Vendor</span>
                  <span className="xs:hidden">Add</span>
                </button>
        <button
    onClick={loadVendors}
    disabled={vendorLoading}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${vendorLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
        {/* Content Area */}
  <div className="flex-1 overflow-y-auto p-3 sm:p-4">
    {vendorLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-blue-600 mb-4"></div>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">Loading vendors...</p>
                </div>
              ) : vendors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium text-base sm:text-lg">No vendors found</p>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
          {vendors
    .filter(vendor => vendor && vendor.vendorName)
    .map((vendor) => (<motion.div 
                      key={vendor._id} 
                      variants={itemVariants}
                      className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
                    >
                      {/* Vendor Header */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 sm:gap-3 mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0">
                              {vendor.vendorName?.charAt(0)?.toUpperCase() || 'V'}
                            </div>
                            <div className="flex-1 min-w-0">
  <h3 className="font-bold text-slate-900 text-base sm:text-xl truncate">{vendor.vendorName || 'Unknown Vendor'}</h3>                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-1">
                                <span className="flex items-center gap-1.5 truncate">
                                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
  <span className="truncate">{vendor.phoneNumber || 'N/A'}</span>                              </span>
                                {vendor.lastOrderDate && (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    Last: {new Date(vendor.lastOrderDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {vendor.totalPending > 0 ? (
                            <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                              <CreditCard className="w-3 h-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Total Orders
                          </p>
                          <p className="font-bold text-slate-900 text-base sm:text-lg">
                            {vendor.totalOrders || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Total Value
                          </p>
                          <p className="font-bold text-slate-900 text-base sm:text-lg break-words">
                            ₨{(vendor.totalPurchaseValue || 0).toFixed(0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                            <CheckSquare className="w-3 h-3 text-emerald-600" />
                            Paid
                          </p>
                          <p className="font-bold text-emerald-600 text-base sm:text-lg break-words">
                            ₨{(vendor.totalPaid || 0).toFixed(0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-red-600" />
                            Pending
                          </p>
                          <p className="font-bold text-red-600 text-base sm:text-lg break-words">
                            ₨{(vendor.totalPending || 0).toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 sm:space-y-3">
                        {/* Primary Actions Row */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewVendor(vendor)}
                            className="flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg sm:rounded-xl hover:bg-purple-700 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">View Details</span>
                            <span className="xs:hidden">View</span>
                          </button>

                          {vendor.totalPending > 0 && (
                            <button
                              onClick={() => {
                                setSelectedVendorForPayment(vendor);
                                setVendorPaymentData({
                                  paymentAmount: vendor.totalPending.toFixed(2),
                                  paymentMethod: 'CASH',
                                  paymentNote: '',
                                  paidBy: ''
                                });
                                setShowVendorPaymentModal(true);
                              }}
                              className="flex-1 min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Make Payment</span>
                              <span className="xs:hidden">Pay</span>
                            </button>
                          )}
                        </div>
  {/* Secondary Actions Row */}
  <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-200">
    {/* Payment History Button - Only show if vendor has payments */}
    {vendor.totalPaid > 0 && (
      <button
        onClick={async () => {
          setLoadingState('loadVendorPaymentHistory', true);
          const result = await getVendorDetails(vendor.vendorName);
          setLoadingState('loadVendorPaymentHistory', false);
          if (result.success) {
            setSelectedVendorForHistory({
              ...vendor,
              purchases: result.data.purchases
            });
            setShowVendorPaymentHistoryModal(true);
          }
        }}
        disabled={actionLoading.loadVendorPaymentHistory}
        className="flex-1 min-w-[90px] px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5"
      >
        {actionLoading.loadVendorPaymentHistory ? (
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
        ) : (
          <>
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Payment History</span>
            <span className="xs:hidden">Payments</span>
          </>
        )}
      </button>
    )}

  
  </div>
                  </div>
                    </motion.div>
                  ))
  }
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
  {/* Vendor Custom Date Range Modal */}
  <AnimatePresence>
    {showVendorCustomDateModal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => {
          setShowVendorCustomDateModal(false);
          if (!vendorCustomDateRange.startDate) {
            setVendorDateFilter('all');
          }
        }}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Custom Date Range</span>
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">Select vendor date range</p>
            </div>
            <button
              onClick={() => {
                setShowVendorCustomDateModal(false);
                if (!vendorCustomDateRange.startDate) {
                  setVendorDateFilter('all');
                }
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={vendorCustomDateRange.startDate}
                  onChange={(e) => setVendorCustomDateRange({...vendorCustomDateRange, startDate: e.target.value})}
                  max={vendorCustomDateRange.endDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={vendorCustomDateRange.endDate}
                  onChange={(e) => setVendorCustomDateRange({...vendorCustomDateRange, endDate: e.target.value})}
                  min={vendorCustomDateRange.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm sm:text-base"
                />
              </div>

              {vendorCustomDateRange.startDate && vendorCustomDateRange.endDate && (
                <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-slate-700">
                    <span className="font-semibold">Range: </span>
                    <span className="block sm:inline mt-1 sm:mt-0">
                      {new Date(vendorCustomDateRange.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {' → '}
                      {new Date(vendorCustomDateRange.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  if (vendorCustomDateRange.startDate && vendorCustomDateRange.endDate) {
                    setShowVendorCustomDateModal(false);
                    loadVendors();
                  } else {
                    showNotification('Please select both start and end dates', 'error');
                  }
                }}
                disabled={!vendorCustomDateRange.startDate || !vendorCustomDateRange.endDate}
                className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Apply Range</span>
              </button>
              <button
                onClick={() => {
                  setShowVendorCustomDateModal(false);
                  setVendorDateFilter('all');
                  setVendorCustomDateRange({ startDate: '', endDate: '' });
                }}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* SIMPLIFIED Vendor Form Modal */}
  <AnimatePresence>
    {showVendorForm && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
        onClick={() => !actionLoading.vendorSubmit && resetVendorForm()}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingVendorId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                {editingVendorId ? 'Edit Vendor' : 'New Vendor'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">Quick vendor setup</p>
            </div>
            <button
              onClick={resetVendorForm}
              disabled={actionLoading.vendorSubmit}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleVendorSubmit}>
              <div className="space-y-4">
                
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={vendorFormData.vendorName}
                    onChange={(e) => setVendorFormData({...vendorFormData, vendorName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="e.g., ABC Market"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={vendorFormData.phoneNumber}
                    onChange={(e) => setVendorFormData({...vendorFormData, phoneNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="0300-1234567"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={actionLoading.vendorSubmit}
                  className="flex-1 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading.vendorSubmit ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {editingVendorId ? 'Update' : 'Add Vendor'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetVendorForm}
                  disabled={actionLoading.vendorSubmit}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Vendor Payment History Modal */}
  <AnimatePresence>
    {showVendorPaymentHistoryModal && selectedVendorForHistory && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => setShowVendorPaymentHistoryModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Vendor Payment History</span>
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">{selectedVendorForHistory.vendorName}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
            <button
    onClick={() => {
      setShowVendorPaymentHistoryFilterModal(true);
    }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                title="Print Payment History"
              >
                <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setShowVendorPaymentHistoryModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            {/* Vendor Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-xs text-slate-600 mb-1">Total Orders</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-slate-900">{selectedVendorForHistory.totalOrders}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="text-xs text-slate-600 mb-1">Total Value</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-purple-600 break-words">₨{selectedVendorForHistory.totalPurchaseValue.toFixed(0)}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-green-500">
                  <p className="text-xs text-slate-600 mb-1">Total Paid</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 break-words">₨{selectedVendorForHistory.totalPaid.toFixed(0)}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border-l-4 border-red-500">
                  <p className="text-xs text-slate-600 mb-1">Pending</p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-red-600 break-words">₨{selectedVendorForHistory.totalPending.toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="truncate">All Payments</span>
              </h3>

              {/* Get all payments from all purchases */}
              {(() => {
                const allPayments = [];
                selectedVendorForHistory.purchases?.forEach(purchase => {
                  purchase.paymentHistory?.forEach(payment => {
                    allPayments.push({
                      ...payment,
                      purchaseId: purchase._id,
                      itemName: purchase.itemName
                    });
                  });
                });
                allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

                return allPayments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-lg sm:rounded-xl">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium text-sm sm:text-base">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {allPayments.map((payment, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:shadow-lg transition-all"
                      >
                        {/* Payment Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-3">
    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-blue-600 break-words">₨{payment.amount.toFixed(2)}</p>
        <p className="text-xs sm:text-sm text-slate-600 truncate">
          {new Date(payment.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <span className="flex-1 sm:flex-none inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">
        Payment #{allPayments.length - index}
      </span>
      {/* Reprint Button */}
      <button
        onClick={() => {
          // Calculate running totals up to this payment
          const paymentsUpToThis = allPayments.slice(index);
          const runningPaid = paymentsUpToThis.reduce((sum, p) => sum + p.amount, 0);
          const runningRemaining = selectedVendorForHistory.totalPurchaseValue - runningPaid;
          
          setPrintVendor({
            ...selectedVendorForHistory,
            itemName: payment.itemName,
            paymentAmount: payment.amount,
            paymentMethod: payment.method,
            paymentNote: payment.note,
            paidBy: payment.paidBy,
            paymentDate: payment.date,
            newPaidAmount: runningPaid,
            newRemainingAmount: runningRemaining,
            isVendorPaymentReceipt: true
          });
          setTimeout(() => window.print(), 100);
        }}
        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all flex-shrink-0"
        title="Reprint Payment Receipt"
      >
        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                            <p className="text-xs text-slate-600 mb-1">For Item</p>
                            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{payment.itemName}</p>
                          </div>
                          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
                            <p className="text-xs text-slate-600 mb-1">Method</p>
                            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{payment.method}</p>
                          </div>
                          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg col-span-2">
                            <p className="text-xs text-slate-600 mb-1">Paid By</p>
                            <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{payment.paidBy || 'Unknown'}</p>
                          </div>
                        </div>

                        {/* Payment Note */}
                        {payment.note && (
                          <div className="bg-blue-50 border border-blue-200 p-2 sm:p-3 rounded-lg">
                            <p className="text-xs text-slate-600 mb-1">Note:</p>
                            <p className="text-xs sm:text-sm text-slate-700 break-words">{payment.note}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Vendor Details Modal */}
  {/* Enhanced Vendor Details Modal with Payment History */}
  <AnimatePresence>
    {selectedVendorDetails && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]"
        onClick={() => setSelectedVendorDetails(null)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Vendor Details</span>
              </h2>
              <p className="text-purple-100 text-xs sm:text-sm mt-1 truncate">{selectedVendorDetails.vendor.vendorName}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
          
              <button
                onClick={() => setSelectedVendorDetails(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Vendor Info Card */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl">
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Vendor Information</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600">Phone Number</p>
                  <p className="font-semibold text-sm sm:text-base break-words">{selectedVendorDetails.vendor.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600">Status</p>
                  <p className={`font-semibold text-sm sm:text-base ${selectedVendorDetails.vendor.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedVendorDetails.vendor.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-blue-500">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{selectedVendorDetails.stats.totalOrders}</p>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-purple-500">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Value</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600 break-words">₨{selectedVendorDetails.stats.totalPurchaseValue.toFixed(0)}</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-green-500">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Paid</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 break-words">₨{selectedVendorDetails.stats.totalPaid.toFixed(0)}</p>
              </div>
              <div className="bg-red-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-red-500">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 break-words">₨{selectedVendorDetails.stats.totalPending.toFixed(0)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedVendorDetails.stats.totalPending > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setSelectedVendorForPayment(selectedVendorDetails.vendor);
                    setVendorPaymentData({
                      paymentAmount: selectedVendorDetails.vendor.totalPending.toFixed(2),
                      paymentMethod: 'CASH',
                      paymentNote: '',
                      paidBy: ''
                    });
                    setSelectedVendorDetails(null);
                    setShowVendorPaymentModal(true);
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Make Payment (₨{selectedVendorDetails.vendor.totalPending.toFixed(2)})</span>
                </button>
              </div>
            )}

            {/* Recent Purchases */}
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Recent Purchases ({selectedVendorDetails.purchases.length})</h3>
              <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                {selectedVendorDetails.purchases.length === 0 ? (
                  <p className="text-center text-slate-500 py-6 sm:py-8 text-sm sm:text-base">No purchases found</p>
                ) : (
                  selectedVendorDetails.purchases.map((purchase) => (
                    <div key={purchase._id} className="bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{purchase.itemName}</p>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">{purchase.category}</p>
                        </div>
                        <span className={`self-start px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <p className="text-slate-600">Quantity</p>
                          <p className="font-semibold truncate">{purchase.quantity} {purchase.unit}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Amount</p>
                          <p className="font-semibold break-words">₨{purchase.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Date</p>
                          <p className="font-semibold text-xs">
                            {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      {purchase.remainingAmount > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-slate-600">Payment Status:</span>
                            <span className="font-bold text-red-600">₨{purchase.remainingAmount.toFixed(2)} pending</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
{/* Grocery Print Templates */}
  {/* Vendor Payment Receipt Print */}
  {printVendor?.isVendorPaymentReceipt && (
    <div className="hidden print:block print-content">
      <div className="receipt-container">
        {/* Header */}
        <div className="text-center mb-2 border-b-2 border-black pb-2">
          <h1 className="text-[24px] font-black uppercase tracking-wide">{grocerySettings?.restaurantName || 'GROCERY STORE'}</h1>
          <p className="text-[11px] font-bold">{grocerySettings?.address || ''}</p>
                <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{grocerySettings?.phone1 || ''}{grocerySettings?.phone2 ? ` | ${grocerySettings.phone2}` : ''}</p>
                 <p className="text-[15px] font-black mt-1">VENDOR PAYMENT RECEIPT</p>
        </div>

        {/* Payment Details */}
        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Receipt #:</span>
            <span className="font-black">{Date.now().toString().slice(-8)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Payment Date:</span>
            <span className="font-black text-[11px]">{new Date(printVendor.paymentDate).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Vendor:</span>
            <span className="font-black">{printVendor.vendorName}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Contact:</span>
            <span className="font-black">{printVendor.phoneNumber}</span>
          </div>
          {printVendor.itemName && (
            <div className="flex justify-between">
              <span className="font-bold">For Item:</span>
              <span className="font-black text-[11px]">{printVendor.itemName}</span>
            </div>
          )}
        </div>

        {/* Payment Transaction */}
        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Payment Method:</span>
            <span className="font-black">{printVendor.paymentMethod}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Paid By:</span>
            <span className="font-black">{printVendor.paidBy || 'Unknown'}</span>
          </div>
          <div className="flex justify-between items-center border-2 border-black p-2 rounded">
            <span className="font-black text-[13px]">Payment Amount:</span>
            <span className="font-black text-[18px]">₨{printVendor.paymentAmount.toFixed(2)}</span>
          </div>
          {printVendor.paymentNote && (
            <div className="mt-2 pt-2 border-t-2 border-black">
              <p className="font-black mb-1">Note:</p>
              <p className="text-[11px] font-bold">{printVendor.paymentNote}</p>
            </div>
          )}
        </div>

        {/* Account Summary */}
        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <p className="font-black mb-2 text-[13px]">ACCOUNT SUMMARY:</p>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Orders:</span>
            <span className="font-black">{printVendor.totalOrders}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Value:</span>
            <span className="font-black">₨{(printVendor.totalPurchaseValue || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Previously Paid:</span>
            <span className="font-black">₨{(printVendor.previousPaid || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-2 border-black p-2 rounded mb-1">
            <span className="font-black">This Payment:</span>
            <span className="font-black text-[16px]">₨{printVendor.paymentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-2 mt-2 mb-1">
            <span className="font-black">Total Paid Now:</span>
            <span className="font-black text-[16px]">₨{(printVendor.totalPaid || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">Remaining Balance:</span>
            <span className="font-black">₨{(printVendor.totalPending || 0).toFixed(2)}</span>
          </div>
          {printVendor.totalPending <= 0 && (
            <div className="text-center mt-2 p-2 border-4 border-black rounded">
              <p className="font-black text-[15px]">✓ FULLY PAID</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] border-t-2 border-black pt-2">
          <p className="text-[10px] font-bold">Print Time: {new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
          <div className="pt-2 border-t-2 text-center border-black mt-2">
            <p className="text-[14px] font-black">
              Software By: M.Ammar Shaikh
            </p>
            <p className="text-[12px] font-bold">
              Tel: 0316-0346330 | 0370-2741544
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Vendor Payment History Print */}
  {printVendor?.isVendorPaymentHistory && (
    <div className="hidden print:block print-content">
      <div className="receipt-container">
        {/* Header */}
        <div className="text-center mb-2 border-b-2 border-black pb-2">
          <h1 className="text-[24px] font-black uppercase tracking-wide">{grocerySettings?.restaurantName || 'GROCERY STORE'}</h1>
          <p className="text-[11px] font-bold">{grocerySettings?.address || ''}</p>
                <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{grocerySettings?.phone1 || ''}{grocerySettings?.phone2 ? ` | ${grocerySettings.phone2}` : ''}</p>
                 <p className="text-[15px] font-black mt-1">VENDOR PAYMENT HISTORY</p>
        </div>

        {/* Vendor & Date Range Info */}
        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Vendor:</span>
            <span className="font-black">{printVendor.vendorName}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Contact:</span>
            <span className="font-black">{printVendor.phoneNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Period:</span>
            <span className="font-black">{printVendor.dateRangeLabel || 'All Time'}</span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Orders:</span>
            <span className="font-black">{printVendor.totalOrders}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Value:</span>
            <span className="font-black">₨{printVendor.totalPurchaseValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Paid:</span>
            <span className="font-black">₨{printVendor.totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Pending:</span>
            <span className="font-black">₨{printVendor.totalPending.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment List */}
        <div className="text-[12px] mb-2">
          <p className="font-black text-[14px] mb-2">ALL PAYMENTS:</p>
          {(() => {
            const allPayments = [];
            printVendor.purchases?.forEach(purchase => {
              purchase.paymentHistory?.forEach(payment => {
                allPayments.push({
                  ...payment,
                  itemName: purchase.itemName
                });
              });
            });
            allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

            return allPayments.length > 0 ? (
              allPayments.map((payment, index) => (
                <div key={index} className="border-2 border-black p-2 mb-2 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="font-black text-[14px]">₨{payment.amount.toFixed(2)}</span>
                    <span className="text-[10px] font-bold">{new Date(payment.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold">Item:</span>
                    <span className="font-bold">{payment.itemName}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold">Method:</span>
                    <span className="font-bold">{payment.method}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold">By:</span>
                    <span className="font-bold">{payment.paidBy || 'Unknown'}</span>
                  </div>
                  {payment.note && (
                    <div className="text-[10px] mt-1 border-t border-black pt-1">
                      <span className="font-bold">Note: </span>
                      <span className="font-bold">{payment.note}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-[12px] font-bold">No payments in selected period</p>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] border-t-2 border-black pt-2">
          <p className="text-[10px] font-bold">Print Time: {new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
          <div className="pt-2 border-t-2 text-center border-black">
            <p className="text-[14px] font-black">
              Software By: M.Ammar Shaikh
            </p>
            <p className="text-[12px] font-bold">
              Tel: 0316-0346330 | 0370-2741544
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Return History Print */}
  {printGrocery?.isReturnHistory && (
    <div className="hidden print:block print-content">
      <div className="receipt-container">
        {/* Header */}
        <div className="text-center mb-2 border-b-2 border-black pb-2">
          <h1 className="text-[24px] font-black uppercase tracking-wide">{grocerySettings?.restaurantName || 'GROCERY STORE'}</h1>
          <p className="text-[11px] font-bold">{grocerySettings?.address || ''}</p>
           <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{grocerySettings?.phone1 || ''}{grocerySettings?.phone2 ? ` | ${grocerySettings.phone2}` : ''}</p>
                 <p className="text-[15px] font-black mt-1">RETURN HISTORY</p>
        </div>

        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Purchase ID:</span>
            <span className="font-black">{printGrocery._id?.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Item:</span>
            <span className="font-black">{printGrocery.itemName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Vendor:</span>
            <span className="font-black">{printGrocery.vendorName}</span>
          </div>
        </div>

        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Original Qty:</span>
            <span className="font-black">{printGrocery.quantity} {printGrocery.unit}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-black">Total Returned:</span>
            <span className="font-black">{printGrocery.returnedQuantity || 0} {printGrocery.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">Net Quantity:</span>
            <span className="font-black">{(printGrocery.quantity - (printGrocery.returnedQuantity || 0)).toFixed(2)} {printGrocery.unit}</span>
          </div>
        </div>

        <div className="text-[12px] mb-2">
          <p className="font-black text-[14px] mb-2">RETURN TRANSACTIONS:</p>
          {printGrocery.returns && printGrocery.returns.length > 0 ? (
            printGrocery.returns.map((ret, index) => (
              <div key={index} className="border-2 border-black p-2 mb-2 rounded">
                <div className="flex justify-between mb-1">
                  <span className="font-black">Return #{index + 1}</span>
                  <span className="font-black text-[14px]">₨{ret.returnAmount?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Qty:</span>
                  <span className="font-bold">{ret.returnQuantity} {ret.unit}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Date:</span>
                  <span className="font-bold text-[10px]">{new Date(ret.returnDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Reason:</span>
                  <span className="font-black">{ret.returnReason}</span>
                </div>
                {ret.returnNotes && (
                  <div className="mt-1 border-t border-black pt-1">
                    <span className="font-bold">Note:</span>
                    <p className="text-[11px] font-bold">{ret.returnNotes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-[12px] font-bold">No returns recorded</p>
          )}
        </div>

        <div className="text-center text-[11px] border-t-2 border-black pt-2">
          <p className="text-[10px] font-bold">Print Time: {new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
          <div className="pt-2 border-t-2 text-center border-black">
            <p className="text-[14px] font-black">
              Software By: M.Ammar Shaikh
            </p>
            <p className="text-[12px] font-bold">
              Tel: 0316-0346330 | 0370-2741544
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Payment History Print */}
  {printGrocery?.isPaymentHistory && (
    <div className="hidden print:block print-content">
      <div className="receipt-container">
        {/* Header */}
        <div className="text-center mb-2 border-b-2 border-black pb-2">
          <h1 className="text-[24px] font-black uppercase tracking-wide">{grocerySettings?.restaurantName || 'GROCERY STORE'}</h1>
          <p className="text-[11px] font-bold">{grocerySettings?.address || ''}</p>
           <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{grocerySettings?.phone1 || ''}{grocerySettings?.phone2 ? ` | ${grocerySettings.phone2}` : ''}</p>
                  <p className="text-[15px] font-black mt-1">PAYMENT HISTORY</p>
        </div>

        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Purchase ID:</span>
            <span className="font-black">{printGrocery._id?.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Item:</span>
            <span className="font-black">{printGrocery.itemName}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Vendor:</span>
            <span className="font-black">{printGrocery.vendorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Order Date:</span>
            <span className="text-[10px] font-bold">{new Date(printGrocery.orderDate || printGrocery.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}</span>
          </div>
        </div>

        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Amount:</span>
            <span className="font-black text-[16px]">₨{printGrocery.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-bold">Total Paid:</span>
            <span className="font-black text-[16px]">₨{(printGrocery.paidAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Remaining:</span>
            <span className="font-black text-[16px]">₨{printGrocery.remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-[12px] mb-2">
          <p className="font-black text-[14px] mb-2">PAYMENT TRANSACTIONS:</p>
          {printGrocery.paymentHistory && printGrocery.paymentHistory.length > 0 ? (
            printGrocery.paymentHistory.map((payment, index) => (
              <div key={index} className="border-2 border-black p-2 mb-2 rounded">
                <div className="flex justify-between mb-1">
                  <span className="font-black">Payment #{index + 1}</span>
                  <span className="font-black text-[14px]">₨{payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Date:</span>
                  <span className="font-bold text-[10px]">{new Date(payment.date).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Method:</span>
                  <span className="font-black">{payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Paid By:</span>
                  <span className="font-black">{payment.paidBy || 'Unknown'}</span>
                </div>
                {payment.note && (
                  <div className="mt-1 border-t border-black pt-1">
                    <span className="font-bold">Note:</span>
                    <p className="text-[11px] font-bold">{payment.note}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-[12px] font-bold">No payments recorded</p>
          )}
        </div>

        <div className="text-center text-[11px] border-t-2 border-black pt-2">
          <p className="text-[10px] font-bold">Print Time: {new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
          <div className="pt-2 border-t-2 text-center border-black">
            <p className="text-[14px] font-black">
              Software By: M.Ammar Shaikh
            </p>
            <p className="text-[12px] font-bold">
              Tel: 0316-0346330 | 0370-2741544
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Regular receipts (Payment, Return, Purchase) */}
  {printGrocery && !printGrocery.isPaymentHistory && !printGrocery.isReturnHistory && (
    <div className="hidden print:block print-content">
      <div className="receipt-container">
        {/* Header */}
        <div className="text-center mb-2 border-b-2 border-black pb-2">
          <h1 className="text-[24px] font-black uppercase tracking-wide">{grocerySettings?.restaurantName || 'GROCERY STORE'}</h1>
          <p className="text-[11px] font-bold">{grocerySettings?.address || ''}</p>
         <p className="text-sm font-medium">For Home Delivery Contact </p>
                    <p className="text-sm font-bold">{grocerySettings?.phone1 || ''}{grocerySettings?.phone2 ? ` | ${grocerySettings.phone2}` : ''}</p>
                  <p className="text-[15px] text-center font-black mt-1">
            {printGrocery.isPaymentReceipt ? 'PAYMENT RECEIPT' : 
            printGrocery.isReturn ? 'ITEM RETURN SLIP' : 
            'PURCHASE RECEIPT'}
          </p>
        </div>

        {/* Purchase ID */}
        <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
          <div className="flex justify-between">
            <span className="font-bold">Purchase ID:</span>
            <span className="font-black">{(printGrocery.purchaseId || printGrocery._id)?.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        {/* Payment Receipt Specific */}
        {printGrocery.isPaymentReceipt && (
          <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
            <div className="flex justify-between mb-1">
              <span className="font-bold">Payment Date:</span>
              <span className="text-[11px] font-bold">{new Date(printGrocery.paymentDate).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-bold">Item:</span>
              <span className="font-black">{printGrocery.itemName}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-bold">Vendor:</span>
              <span className="font-black">{printGrocery.vendorName}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-bold">Method:</span>
              <span className="font-black">{printGrocery.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Paid By:</span>
              <span className="font-black">{printGrocery.paidBy || 'Unknown'}</span>
            </div>
          </div>
        )}

        {/* Regular Purchase */}
        {!printGrocery.isPaymentReceipt && !printGrocery.isReturn && (
          <>
            <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
              <div className="flex justify-between mb-1">
                <span className="font-bold">Date:</span>
                <span className="font-bold text-[11px]">{new Date(printGrocery.orderDate || printGrocery.createdAt).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Item:</span>
                <span className="font-black">{printGrocery.itemName}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Category:</span>
                <span className="font-black">{printGrocery.category}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Vendor:</span>
                <span className="font-black">{printGrocery.vendorName}</span>
              </div>
              {printGrocery.vendorContact && (
                <div className="flex justify-between mb-1">
                  <span className="font-bold">Contact:</span>
                  <span className="font-bold">{printGrocery.vendorContact}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-bold">Ordered By:</span>
                <span className="font-black">{printGrocery.orderedBy} ({printGrocery.orderedByRole})</span>
              </div>
            </div>

            {/* Show Payments on Purchase Receipt */}
            {printGrocery.paymentHistory && printGrocery.paymentHistory.length > 0 && (
              <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
                <p className="font-black mb-1">PAYMENTS:</p>
                {printGrocery.paymentHistory.map((payment, idx) => (
                  <div key={idx} className="text-[12px] mb-1 border-b border-black pb-1">
                    <div className="flex justify-between">
                      <span className="font-black">₨{payment.amount.toFixed(2)}</span>
                      <span className="text-[10px] font-bold">{new Date(payment.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}</span>
                    </div>
                  </div>
                  ))}
              </div>
            )}

            {/* Show Returns on Purchase Receipt */}
            {printGrocery.returns && printGrocery.returns.length > 0 && (
              <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
                <p className="font-black mb-1">RETURNS:</p>
                {printGrocery.returns.map((ret, idx) => (
                  <div key={idx} className="text-[12px] mb-1 border-b border-black pb-1">
                    <div className="flex justify-between">
                      <span className="font-black text-[11px]"><span className="text-[13px]">{ret.returnQuantity} {ret.unit}</span> - {ret.returnReason}</span>
                      <span className="text-[10px] font-bold">{new Date(ret.returnDate).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Return Slip */}
        {printGrocery.isReturn && (
          <div className="text-[12px] mb-2 border-b-2 border-black pb-2">
            <div className="flex justify-between mb-1">
              <span className="font-bold">Return Date:</span>
              <span className="text-[11px] font-bold">{new Date(printGrocery.returnDate).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-bold">Reason:</span>
              <span className="font-black">{printGrocery.returnReason}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-bold">Item:</span>
              <span className="font-black">{printGrocery.itemName}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-bold">Category:</span>
              <span className="font-black">{printGrocery.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Vendor:</span>
              <span className="font-black">{printGrocery.vendorName}</span>
            </div>
          </div>
        )}

        {/* Amount Details */}
        <div className="text-[12px] mb-2">
          {printGrocery.isPaymentReceipt && (
            <>
              <div className="flex justify-between border-b-2 border-black pb-2 mb-2">
                <span className="font-bold">Order Total:</span>
                <span className="font-black text-[16px]">₨{printGrocery.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Previously Paid:</span>
                <span className="font-black">₨{(printGrocery.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">This Payment:</span>
                <span className="font-black text-[16px]">₨{printGrocery.paymentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-black pt-2 mt-2 mb-1">
                <span className="font-bold">Total Paid Now:</span>
                <span className="font-black text-[16px]">₨{printGrocery.newPaidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Remaining:</span>
                <span className="font-black text-[16px]">₨{printGrocery.newRemainingAmount.toFixed(2)}</span>
              </div>
              {printGrocery.newRemainingAmount <= 0 && (
                <div className="text-center mt-2 p-2 border-4 border-black rounded">
                  <span className="font-black text-[15px]">✓ FULLY PAID</span>
                </div>
              )}
            </>
          )}

          {!printGrocery.isPaymentReceipt && (
            <>
              <div className="flex justify-between border-b-2 border-black pb-2 mb-2">
                <span className="font-bold">{printGrocery.isReturn ? 'Return Quantity:' : 'Quantity:'}</span>
                <span className="font-black text-[16px]">
                  {printGrocery.isReturn ? printGrocery.returnQuantity : printGrocery.quantity} {printGrocery.unit}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Unit Price:</span>
                {printGrocery.unitPrice > 0 && (
                  <span className="font-black">₨{printGrocery.unitPrice.toFixed(2)}</span>
                )}
                {printGrocery.unitPrice === 0 && (
                  <span className="font-black">_______</span>
                )}
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">{printGrocery.isReturn ? 'Return Amount:' : 'Total Amount:'}</span>
                <span className="font-black text-[16px]">
                  ₨{printGrocery.isReturn ? printGrocery.returnAmount?.toFixed(2) : printGrocery.totalAmount.toFixed(2)}
                </span>
              </div>
              {!printGrocery.isReturn && (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold">Payment:</span>
                    <span className="font-black">
                      {printGrocery.paymentMethod}
                    </span>
                  </div>
                  {(printGrocery.paymentMethod === 'CREDIT' || printGrocery.paymentMethod === 'BANK_TRANSFER') && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold">Paid:</span>
                        <span className="font-black">₨{(printGrocery.paidAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Remaining:</span>
                        <span className="font-black">₨{printGrocery.remainingAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="font-bold">Status:</span>
                    <span className="font-black">
                      {printGrocery.status}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Notes */}
        {((printGrocery.notes && !printGrocery.isReturn && !printGrocery.isPaymentReceipt) || 
          (printGrocery.returnNotes && printGrocery.isReturn) ||
          (printGrocery.paymentNote && printGrocery.isPaymentReceipt)) && (
          <div className="text-[12px] border-t-2 border-black pt-2 mb-2">
            <p className="font-black mb-1">NOTES:</p>
            <p className="text-[11px] font-bold">
              {printGrocery.isReturn ? printGrocery.returnNotes : 
              printGrocery.isPaymentReceipt ? printGrocery.paymentNote :
              printGrocery.notes}
            </p>
          </div>
        )}

        <div className="text-center text-[11px] border-t-2 border-black pt-2">
          <p className="text-[10px] font-bold">Print Time: {new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
          <div className="pt-2 border-t-2 text-center border-black">
            <p className="text-[14px] font-black">
              Software By: M.Ammar Shaikh
            </p>
            <p className="text-[12px] font-bold">
              Tel: 0316-0346330 | 0370-2741544
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Grocery Print Styles */}
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
        font-family: 'Courier New', monospace;
        color: #000;
        background: #fff;
        font-size: 12px;
        line-height: 1.4;
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

      .receipt-container {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `}</style>
 {/*grocerry Print Styles */}
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

      .receipt-container {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `}</style>
  {/* Vendor Payment Modal - Mobile Responsive */}
  <AnimatePresence>
    {showVendorPaymentModal && selectedVendorForPayment && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[70]"
        onClick={() => !actionLoading.vendorPayment && setShowVendorPaymentModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Pay Vendor</span>
              </h2>
              <p className="text-green-100 text-xs sm:text-sm mt-1 truncate">{selectedVendorForPayment.vendorName}</p>
            </div>
            <button
              onClick={() => setShowVendorPaymentModal(false)}
              disabled={actionLoading.vendorPayment}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1">
            {/* Vendor Summary */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Total Orders</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{selectedVendorForPayment.totalOrders}</p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Total Paid</p>
                  <p className="font-bold text-green-600 text-sm sm:text-base break-words">
                    ₨{selectedVendorForPayment.totalPaid.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Pending</p>
                  <p className="font-bold text-red-600 text-sm sm:text-base break-words">
                    ₨{selectedVendorForPayment.totalPending.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleVendorPaymentSubmit}>
              <div className="space-y-3 sm:space-y-4">
                {/* Payment Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Payment Amount (₨) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    max={selectedVendorForPayment.totalPending}
                    value={vendorPaymentData.paymentAmount}
                    onChange={(e) => setVendorPaymentData({...vendorPaymentData, paymentAmount: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 text-base sm:text-lg font-bold"
                    placeholder="Enter payment amount"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum: ₨{selectedVendorForPayment.totalPending.toFixed(2)}</p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={vendorPaymentData.paymentMethod}
                    onChange={(e) => setVendorPaymentData({...vendorPaymentData, paymentMethod: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 text-sm sm:text-base"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                    <option value="CHEQUE">📝 Cheque</option>
                  </select>
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    👤 Paid By *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorPaymentData.paidBy}
                    onChange={(e) => setVendorPaymentData({...vendorPaymentData, paidBy: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 text-sm sm:text-base"
                    placeholder="e.g., Owner, Manager"
                  />
                </div>

                {/* Payment Note */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Payment Note (Optional)
                  </label>
                  <textarea
                    value={vendorPaymentData.paymentNote}
                    onChange={(e) => setVendorPaymentData({...vendorPaymentData, paymentNote: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-slate-900 text-sm sm:text-base"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-slate-700">
                    💡 <span className="font-semibold">Payment Distribution:</span> This payment will be automatically distributed across unpaid orders, starting with the oldest order first (FIFO).
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  type="submit"
                  disabled={actionLoading.vendorPayment}
                  className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {actionLoading.vendorPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden xs:inline">Processing Payment...</span>
                      <span className="xs:hidden">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Process Payment</span>
                      <span className="xs:hidden">Pay</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVendorPaymentModal(false)}
                  disabled={actionLoading.vendorPayment}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* Vendor Payment History Filter Modal */}
  <AnimatePresence>
    {showVendorPaymentHistoryFilterModal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[80]"
        onClick={() => setShowVendorPaymentHistoryFilterModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 sm:p-4 md:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <span className="truncate">Select Date Range</span>
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm mt-1 truncate">Filter payment history</p>
            </div>
            <button
              onClick={() => setShowVendorPaymentHistoryFilterModal(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Quick Filters */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { value: 'all', label: 'All Time', icon: '📊' },
                  { value: 'today', label: 'Today', icon: '📅' },
                  { value: 'week', label: 'This Week', icon: '📆' },
                  { value: 'month', label: 'This Month', icon: '🗓️' },
                  { value: 'custom', label: 'Custom Range', icon: '🔍' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setVendorHistoryDateFilter(filter.value)}
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left ${
                      vendorHistoryDateFilter === filter.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{filter.icon}</span>
                      <span className={`font-semibold text-sm ${
                        vendorHistoryDateFilter === filter.value ? 'text-indigo-700' : 'text-slate-700'
                      }`}>
                        {filter.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {vendorHistoryDateFilter === 'custom' && (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={vendorHistoryCustomRange.startDate}
                      onChange={(e) => setVendorHistoryCustomRange({
                        ...vendorHistoryCustomRange,
                        startDate: e.target.value
                      })}
                      max={vendorHistoryCustomRange.endDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={vendorHistoryCustomRange.endDate}
                      onChange={(e) => setVendorHistoryCustomRange({
                        ...vendorHistoryCustomRange,
                        endDate: e.target.value
                      })}
                      min={vendorHistoryCustomRange.startDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
 {/* Action Buttons */}
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
  <button
    onClick={async () => {
      if (vendorHistoryDateFilter === 'custom' && (!vendorHistoryCustomRange.startDate || !vendorHistoryCustomRange.endDate)) {
        showNotification('Please select both start and end dates', 'error');
        return;
      }
      
      setShowVendorPaymentHistoryFilterModal(false);
      
      // Build date filters
      let dateFilters = {};
      const now = new Date();
      
      switch(vendorHistoryDateFilter) {
        case 'today':
          const todayStart = new Date(now.setHours(0, 0, 0, 0));
          dateFilters.createdAt = { $gte: todayStart };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilters.createdAt = { $gte: weekAgo };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilters.createdAt = { $gte: monthStart };
          break;
        case 'custom':
          const start = new Date(vendorHistoryCustomRange.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(vendorHistoryCustomRange.endDate);
          end.setHours(23, 59, 59, 999);
          dateFilters.createdAt = { $gte: start, $lte: end };
          break;
      }
      
      // Load vendor details with filters
      setLoadingState('loadVendorPaymentHistory', true);
      const result = await getVendorDetails(selectedVendorForHistory.vendorName, dateFilters);
      setLoadingState('loadVendorPaymentHistory', false);
      
      if (result.success) {
        // Calculate filtered stats
        const filteredPurchases = result.data.purchases || [];
        const filteredStats = {
          totalOrders: filteredPurchases.length,
          totalPurchaseValue: filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
          totalPaid: filteredPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
          totalPending: filteredPurchases.reduce((sum, p) => sum + p.remainingAmount, 0)
        };
        
        // Prepare print data with filter info
        const dateRangeLabel = vendorHistoryDateFilter === 'custom' 
          ? `${new Date(vendorHistoryCustomRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(vendorHistoryCustomRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : vendorHistoryDateFilter === 'today' ? 'Today'
          : vendorHistoryDateFilter === 'week' ? 'This Week'
          : vendorHistoryDateFilter === 'month' ? 'This Month'
          : 'All Time';
        
        setPrintVendor({ 
          ...selectedVendorForHistory,
          ...filteredStats,
          purchases: filteredPurchases,
          isPaymentHistory: true,
          isVendorPaymentHistory: true,
          dateFilter: vendorHistoryDateFilter,
          dateRangeLabel: dateRangeLabel,
          customRange: vendorHistoryDateFilter === 'custom' ? vendorHistoryCustomRange : null
        });
        setTimeout(() => window.print(), 100);
      } else {
        showNotification(result.error || 'Failed to load payment history', 'error');
      }
    }}
    disabled={vendorHistoryDateFilter === 'custom' && (!vendorHistoryCustomRange.startDate || !vendorHistoryCustomRange.endDate)}
    className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
  >
    <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
    <span>Print History</span>
  </button>
  <button
    onClick={() => setShowVendorPaymentHistoryFilterModal(false)}
    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-base"
  >
    Cancel
  </button>
</div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

 
      </>
    );
  };

  const CustomSelect = ({ value, onChange, options, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-all"
        >
          <span className="flex items-center gap-2">
            {icon}
            <span>{selectedOption?.icon}</span>
            <span className="hidden sm:inline">{selectedOption?.label}</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-all flex items-center gap-2 text-sm ${
                    value === option.value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const InfoCard = ({ label, value, color }) => {
    const colorClasses = {
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };

    return (
      <div className={`p-3 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
        <p className="text-xs opacity-75 mb-1">{label}</p>
        <p className="font-bold text-lg">{value}</p>
      </div>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Vegetables': '🥬',
      'Fruits': '🍎',
      'Meat & Poultry': '🍗',
      'Seafood': '🐟',
      'Dairy & Eggs': '🥚',
      'Grains & Cereals': '🌾',
      'Spices & Condiments': '🌶️',
      'Beverages': '🥤',
      'Bakery': '🍞',
      'Frozen Foods': '🧊',
      'Cooking Oil': '🛢️',
      'Cleaning Supplies': '🧹',
      'Disposables': '🗑️',
      'Other': '📦'
    };
    return icons[category] || '📦';
  };

  export default GroceryManagement;