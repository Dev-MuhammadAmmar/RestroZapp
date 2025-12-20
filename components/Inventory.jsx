// app/inventory/page.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Trash2, DollarSign, Package, 
  TrendingUp, Filter, X, ChevronDown, Percent, 
  Settings, Grid3x3, List, AlertCircle, CheckCircle, 
  Sparkles, Tag
} from 'lucide-react';

// Import server actions
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemStatus,
} from '@/lib/actions/menuItems';

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUpdateCategories,
} from '@/lib/actions/categories';

// Available emoji icons
const availableIcons = [
  "🥗","🍔","🍗","🍟","🍵",
  "🍖","♨️","🔥","🥩","🥓","🍳",
  "🍧","🍨","🧁","🥞","🧋","🍜",
  "🍕","🥗","🍔","🎁","🍚","🐟",
  "🍟","🌯","🥚","🍲","🍱","🍿",
  "🍛","🍹","🍸","🍷","🍾","🥤"
]

// Color palette for categories
const colorPalette = [
  '#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];

export default function InventoryPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [showInactiveItems, setShowInactiveItems] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        getMenuItems(),
        getCategories(),
      ]);

      if (itemsRes.success) {
        setMenuItems(itemsRes.data);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      item.categoryId?._id === selectedCategory || 
      item.categoryId === selectedCategory;
    const matchesActive = showInactiveItems || item.isActive;
    return matchesSearch && matchesCategory && matchesActive;
  });

  const totalItems = menuItems.filter(item => item.isActive).length;
  const avgProfitMargin = menuItems.length > 0
    ? Math.round(menuItems.reduce((sum, item) => sum + item.profitMargin, 0) / menuItems.length)
    : 0;
  const totalRevenuePotential = menuItems
    .filter(item => item.isActive)
    .reduce((sum, item) => sum + item.sellingPrice, 0);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const result = await deleteMenuItem(id);
    if (result.success) {
      setMenuItems(menuItems.filter((item) => item._id !== id));
      showNotification('Item deleted successfully', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  };

  const handleToggleActive = async (id) => {
    const result = await toggleMenuItemStatus(id);
    if (result.success) {
      setMenuItems(menuItems.map(item => 
        item._id === id ? result.data : item
      ));
      showNotification('Item status updated', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentItem(null);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = async (itemData) => {
    let result;
    
    if (currentItem) {
      result = await updateMenuItem(currentItem._id, itemData);
      if (result.success) {
        setMenuItems(menuItems.map((i) => 
          i._id === currentItem._id ? result.data : i
        ));
        showNotification('Item updated successfully', 'success');
      }
    } else {
      result = await createMenuItem(itemData);
      if (result.success) {
        setMenuItems([...menuItems, result.data]);
        showNotification('Item added successfully', 'success');
      }
    }

    if (result.error) {
      showNotification(result.error, 'error');
      return;
    }

    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveCategories = async (updatedCategories) => {
    const result = await bulkUpdateCategories(updatedCategories);
    if (result.success) {
      await fetchData(); // Refresh all data
      showNotification('Categories updated successfully', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    const result = await deleteCategory(id);
    if (result.success) {
      setCategories(categories.filter(cat => cat._id !== id));
      showNotification('Category deleted successfully', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  };

  const getCategoryById = (categoryId) => {
    if (typeof categoryId === 'object') {
      return categoryId; // Already populated
    }
    return categories.find(cat => cat._id === categoryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#10b981] mx-auto mb-4"></div>
          <p className="text-[#64748b] font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen w-full overflow-hidden bg-[#f5f7fa] p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[100%] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e293b] mb-2 flex items-center gap-2 sm:gap-3">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-[#10b981]" />
                Menu Management
              </h1>
              <p className="text-sm sm:text-base text-[#64748b]">
                Manage your menu items, categories, pricing, and profit margins
              </p>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-md text-sm sm:text-base"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Manage Categories</span>
              <span className="sm:hidden">Categories</span>
            </button>
          </div>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg ${
                notification.type === 'success'
                  ? 'bg-[#10b981] text-white'
                  : 'bg-[#ef4444] text-white'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium text-sm sm:text-base">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#10b981]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Active Items</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">{totalItems}</p>
                <p className="text-[#10b981] text-xs sm:text-sm font-medium mt-1">
                  {categories.length} categories
                </p>
              </div>
              <div className="bg-[#10b981] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#8b5cf6]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Avg. Profit</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">{avgProfitMargin}%</p>
                <p className="text-[#8b5cf6] text-xs sm:text-sm font-medium mt-1">Across all</p>
              </div>
              <div className="bg-[#8b5cf6] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#f59e0b]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Menu Value</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1e293b]">
                  ₨{totalRevenuePotential.toLocaleString()}
                </p>
                <p className="text-[#f59e0b] text-xs sm:text-sm font-medium mt-1">Total</p>
              </div>
              <div className="bg-[#f59e0b] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#06b6d4]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Best Margin</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {menuItems.length > 0 ? Math.max(...menuItems.map(i => i.profitMargin)) : 0}%
                </p>
                <p className="text-[#06b6d4] text-xs sm:text-sm font-medium mt-1">Highest</p>
              </div>
              <div className="bg-[#06b6d4] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters & Actions Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm mb-4 sm:mb-6"
        >
          {/* Mobile Search */}
          <div className="relative mb-3 sm:mb-4 lg:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all text-[#1e293b] text-sm"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
            {/* Desktop Search */}
            <div className="relative w-full lg:w-[300px] flex-shrink-0 hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all text-[#1e293b]"
              />
            </div>

            {/* Category Filter - Mobile Toggle */}
            <div className="w-full lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-[#f1f5f9] text-[#475569] rounded-lg hover:bg-[#e2e8f0] transition-all font-medium"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {selectedCategory === 'all' ? 'All Categories' : getCategoryById(selectedCategory)?.name}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-left ${
                        selectedCategory === 'all'
                          ? 'bg-[#10b981] text-white shadow-md'
                          : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => {
                          setSelectedCategory(category._id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          selectedCategory === category._id
                            ? 'text-white shadow-md'
                            : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                        }`}
                        style={{
                          backgroundColor:
                            selectedCategory === category._id
                              ? category.color
                              : undefined,
                        }}
                      >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category Filter - Desktop Horizontal */}
            <div className="hidden lg:flex gap-2 overflow-x-auto items-center mordern-scollbar pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === category._id
                      ? 'text-white shadow-md'
                      : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === category._id
                        ? category.color
                        : undefined,
                  }}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* View Toggle & Actions */}
            <div className="flex gap-2 w-full lg:w-auto">
              <div className="flex bg-[#f1f5f9] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#10b981] shadow-sm'
                      : 'text-[#64748b]'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-[#10b981] shadow-sm'
                      : 'text-[#64748b]'
                  }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowInactiveItems(!showInactiveItems)}
                className={`p-2 rounded-lg transition-all ${
                  showInactiveItems
                    ? 'bg-[#f59e0b] text-white shadow-md'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md flex-1 sm:flex-initial justify-center"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Add Item</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Menu Items - Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const category = getCategoryById(item.categoryId);
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all border-t-4 ${
                      !item.isActive ? 'opacity-60' : ''
                    }`}
                    style={{ borderTopColor: category?.color || '#10b981' }}
                  >
                    <div className="p-4 sm:p-5 md:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="text-3xl sm:text-4xl md:text-5xl">{category?.icon || '🍽️'}</div>
                        <div className="flex flex-col gap-2">
                          <span
                            className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: category?.color || '#10b981' }}
                          >
                            {category?.name || 'Other'}
                          </span>
                          {!item.isActive && (
                            <span className="px-2 sm:px-3 py-1 bg-[#ef4444] text-white rounded-full text-xs font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-2">
                        {item.name}
                      </h3>
                      
                      {item.description && (
                        <p className="text-xs sm:text-sm text-[#64748b] mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {item.preparationTime && (
                        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs text-[#94a3b8]">
                          <span>⏱️</span>
                          <span>{item.preparationTime}</span>
                        </div>
                      )}

                      <div className="space-y-2 mb-3 sm:mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-[#64748b]">Cost:</span>
                          <span className="text-xs sm:text-sm font-semibold text-[#1e293b]">
                            ₨{item.costPrice}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-[#64748b]">Profit:</span>
                          <span className="text-xs sm:text-sm font-semibold text-[#8b5cf6]">
                            {item.profitMargin}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#f1f5f9]">
                          <span className="text-xs sm:text-sm font-medium text-[#64748b]">Price:</span>
                          <span className="text-lg sm:text-xl font-bold text-[#10b981]">
                            ₨{item.sellingPrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(item._id)}
                          className={`flex-1 p-2 rounded-lg transition-all font-medium text-xs sm:text-sm ${
                            item.isActive
                              ? 'bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]'
                              : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
                          }`}
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Menu Items - List View */}
        {viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden mb-8"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Item</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Cost</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Profit</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredItems.map((item, index) => {
                      const category = getCategoryById(item.categoryId);
                      return (
                        <motion.tr
                          key={item._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all ${
                            !item.isActive ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{category?.icon || '🍽️'}</span>
                              <div>
                                <p className="font-medium text-[#1e293b]">{item.name}</p>
                                {item.preparationTime && (
                                  <p className="text-xs text-[#94a3b8]">⏱️ {item.preparationTime}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: category?.color || '#10b981' }}
                            >
                              {category?.name || 'Other'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#1e293b] font-medium">₨{item.costPrice}</td>
                          <td className="px-6 py-4">
                            <span className="text-[#8b5cf6] font-semibold">{item.profitMargin}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[#10b981] font-bold text-lg">₨{item.sellingPrice}</span>
                          </td>
                          <td className="px-6 py-4">
                            {item.isActive ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#d1fae5] text-[#059669] rounded-full text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fee2e2] text-[#ef4444] rounded-full text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleActive(item._id)}
                                className={`p-2 rounded-lg transition-all ${
                                  item.isActive
                                    ? 'bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]'
                                    : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
                                }`}
                                title={item.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {item.isActive ? '◉' : '○'}
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl"
          >
            <Package className="w-20 h-20 text-[#cbd5e1] mx-auto mb-4" />
            <p className="text-[#64748b] text-lg font-medium">No items found</p>
            <p className="text-[#94a3b8] text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <ItemModal
            isOpen={isAddModalOpen || isEditModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setCurrentItem(null);
            }}
            item={currentItem}
            categories={categories}
            onSave={handleSaveItem}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            categories={categories}
            onSave={handleSaveCategories}
            onDelete={handleDeleteCategory}
          />
        )}
      </AnimatePresence>
    </div>
    <style jsx global>{`
  @media print {
    .modern-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #10b981 #f1f5f9;
      scroll-behavior: smooth;
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
  }

  /* Mobile scrollbar (outside print query) */
  @media (max-width: 640px) {
    .modern-scrollbar::-webkit-scrollbar {
      width: 4px;
    }

    .modern-scrollbar::-webkit-scrollbar-thumb {
      border-width: 1px;
    }
  }
`}</style>
</>
  );
}

// Item Modal Component
function ItemModal({ isOpen, onClose, item, categories, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(
    item || {
      name: '',
      categoryId: categories[0]?._id || '',
      costPrice: 0,
      profitAmount: 0,
      profitMargin: 0,
      sellingPrice: 0,
      isActive: true,
      description: '',
      preparationTime: '',
    }
  );

  useEffect(() => {
    if (item) {
      const profitAmt = item.sellingPrice - item.costPrice;
      setFormData({
        name: item.name,
        categoryId: typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId,
        costPrice: item.costPrice,
        profitAmount: profitAmt,
        profitMargin: item.profitMargin,
        sellingPrice: item.sellingPrice,
        isActive: item.isActive,
        description: item.description || '',
        preparationTime: item.preparationTime || '',
      });
    }
  }, [item]);

  const calculateFromCostAndProfit = (cost, profit) => {
    const selling = cost + profit;
    const margin = cost > 0 ? Math.round((profit / cost) * 100) : 0;
    return { sellingPrice: selling, profitMargin: margin };
  };

  const handleCostChange = (cost) => {
    const { sellingPrice, profitMargin } = calculateFromCostAndProfit(cost, formData.profitAmount);
    setFormData({ ...formData, costPrice: cost, sellingPrice, profitMargin });
  };

  const handleProfitAmountChange = (profit) => {
    const { sellingPrice, profitMargin } = calculateFromCostAndProfit(formData.costPrice, profit);
    setFormData({ ...formData, profitAmount: profit, sellingPrice, profitMargin });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const profitAmount = formData.profitAmount;

  return (
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  onClick={onClose}
>
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.95, opacity: 0 }}
    transition={{ type: "spring", duration: 0.3 }}
    onClick={(e) => e.stopPropagation()}
    className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
  >
    {/* Header - Fixed */}
    <div className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
          {item ? <Edit2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
          {item ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>
        <p className="text-[#d1fae5] text-xs sm:text-sm mt-1 hidden sm:block">
          Fill in the details below to {item ? 'update' : 'create'} a menu item
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>

    {/* Form Content - Scrollable */}
    <div className="overflow-y-auto flex-1">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        {/* Two Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-[#1e293b] flex items-center gap-2 pb-2 border-b border-[#e2e8f0]">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981]" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Item Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                disabled={isSaving}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                placeholder="e.g., Beef Burger Deluxe"
              />
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Category *
              </label>
              <div className="relative">
                <select
                  required
                  disabled={isSaving}
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Preparation Time
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={formData.preparationTime}
                onChange={(e) =>
                  setFormData({ ...formData, preparationTime: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                placeholder="e.g., 10-12 mins (Optional)"
              />
            </div>
            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Description
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                placeholder="e.g., Freshly brewed coffee (Optional)"
              />
            </div>

            {/* Status Toggle - Mobile */}
            <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 bg-[#f8fafc] rounded-lg">
              <div>
                <p className="font-medium text-[#1e293b] text-sm sm:text-base">Item Status</p>
                <p className="text-xs sm:text-sm text-[#64748b]">
                  {formData.isActive ? 'Active & visible' : 'Hidden from menu'}
                </p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.isActive ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'
                }`}
              >
                <motion.div
                  animate={{ x: formData.isActive ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
          </div>

          {/* Right Column - Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-[#1e293b] flex items-center gap-2 pb-2 border-b border-[#e2e8f0]">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981]" />
              Pricing & Profit
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                  Cost Price (₨) *
                </label>
                <input
                  type="number"
                  required
                  disabled={isSaving}
                  min="0"
                  step="1"
                  value={formData.costPrice}
                  onChange={(e) => handleCostChange(Number(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="0"
                />
                <p className="text-[10px] sm:text-xs text-[#94a3b8] mt-1">
                  💡 Total cost to make
                </p>
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                  Profit Amount (₨) *
                </label>
                <input
                  type="number"
                  required
                  disabled={isSaving}
                  min="0"
                  step="1"
                  value={formData.profitAmount}
                  onChange={(e) => handleProfitAmountChange(Number(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="0"
                />
                <p className="text-[10px] sm:text-xs text-[#94a3b8] mt-1">
                  💰 Your profit amount
                </p>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-gradient-to-br from-[#10b981]/10 via-[#8b5cf6]/10 to-[#3b82f6]/10 p-3 sm:p-4 rounded-xl border-2 border-[#10b981]/20">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                  <p className="text-[10px] sm:text-xs text-[#64748b] mb-1">Cost</p>
                  <p className="text-sm sm:text-xl font-bold text-[#1e293b]">
                    ₨{formData.costPrice}
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                  <p className="text-[10px] sm:text-xs text-[#64748b] mb-1">Profit</p>
                  <p className="text-sm sm:text-xl font-bold text-[#8b5cf6]">
                    ₨{profitAmount}
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                  <p className="text-[10px] sm:text-xs text-[#64748b] mb-1">Margin</p>
                  <p className="text-sm sm:text-xl font-bold text-[#f59e0b]">
                    {formData.profitMargin}%
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white rounded-lg border-2 border-[#10b981]">
                  <p className="text-[10px] sm:text-xs text-[#64748b] mb-1">Selling</p>
                  <p className="text-base sm:text-2xl font-bold text-[#10b981]">
                    ₨{formData.sellingPrice}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Toggle - Desktop */}
            <div className="hidden lg:flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
              <div>
                <p className="font-medium text-[#1e293b]">Item Status</p>
                <p className="text-sm text-[#64748b]">
                  {formData.isActive ? 'Item is active and visible' : 'Item is hidden from menu'}
                </p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`relative w-14 h-7 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.isActive ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'
                }`}
              >
                <motion.div
                  animate={{ x: formData.isActive ? 28 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-[#e2e8f0]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : item ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Update Item
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Item
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </motion.div>
</motion.div>
  );
}

// Category Management Modal Component
function CategoryModal({ isOpen, onClose, categories, onSave, onDelete }) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '🍽️',
    color: '#10b981',
  });

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const category = {
        ...newCategory,
        isNew: true,
      };
      setLocalCategories([...localCategories, category]);
      setNewCategory({ name: '', icon: '🍽️', color: '#10b981' });
    }
  };

  const handleUpdateCategory = (index, updates) => {
    setLocalCategories(
      localCategories.map((cat, idx) => (idx === index ? { ...cat, ...updates } : cat))
    );
  };

  const handleDeleteCategory = async (category, index) => {
    if (category._id) {
      // If it's an existing category, call the delete API
      await onDelete(category._id);
    }
    // Remove from local state
    setLocalCategories(localCategories.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(localCategories);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  onClick={onClose}
>
  <motion.div
    initial={{ scale: 0.95, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.95, opacity: 0, y: 20 }}
    transition={{ type: "spring", duration: 0.3 }}
    onClick={(e) => e.stopPropagation()}
    className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
  >
    {/* Header - Fixed */}
    <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          Manage Categories
        </h2>
        <p className="text-[#e9d5ff] text-xs sm:text-sm mt-1 hidden sm:block">
          Add, edit, or remove menu categories
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>

    {/* Content - Scrollable */}
    <div className="overflow-y-auto flex-1">
      <div className="p-4 sm:p-6">
        {/* Two Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          
          {/* Left Column - Add New Category (3 columns) */}
          <div className="lg:col-span-3 bg-gradient-to-br from-[#8b5cf6]/10 to-[#3b82f6]/10 p-4 sm:p-6 rounded-xl border-2 border-[#8b5cf6]/20">
            <h3 className="text-base sm:text-lg font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b5cf6]" />
              Add New Category
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                  Category Name *
                </label>
                <input
                  type="text"
                  disabled={isSaving}
                  autoFocus
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCategory.name.trim()) {
                      handleAddCategory();
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="e.g., Appetizers"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                    Icon
                  </label>
                  <select
                    disabled={isSaving}
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, icon: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-xl sm:text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                    Preview
                  </label>
                  <div 
                    className="w-full h-10 sm:h-12 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 border-[#e2e8f0]"
                    style={{ backgroundColor: newCategory.color }}
                  >
                    {newCategory.icon}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                  Color
                </label>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-2">
                  {colorPalette.slice(0, 20).map((color) => (
                    <button
                      key={color}
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        setNewCategory({ ...newCategory, color })
                      }
                      className={`w-full aspect-square rounded-md sm:rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        newCategory.color === color
                          ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-[#8b5cf6] scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim() || isSaving}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Category
              </button>
            </div>
          </div>

          {/* Right Column - Existing Categories (2 columns) */}
          <div className="lg:col-span-2">
            <h3 className="text-base sm:text-lg font-semibold text-[#1e293b] mb-4 flex items-center justify-between">
              <span>Categories ({localCategories.length})</span>
            </h3>
            <div className="space-y-2 sm:space-y-3 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
              <AnimatePresence>
                {localCategories.map((category, index) => (
                  <motion.div
                    key={category._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border-2 border-[#e2e8f0] rounded-lg p-3 sm:p-4 hover:shadow-md transition-all"
                  >
                    {editingId === index ? (
                      <div className="space-y-2 sm:space-y-3">
                        <input
                          type="text"
                          disabled={isSaving}
                          value={category.name}
                          onChange={(e) =>
                            handleUpdateCategory(index, {
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            disabled={isSaving}
                            value={category.icon}
                            onChange={(e) =>
                              handleUpdateCategory(index, {
                                icon: e.target.value,
                              })
                            }
                            className="w-full px-2 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {availableIcons.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                            className="px-3 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <span className="text-2xl sm:text-3xl flex-shrink-0">{category.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1e293b] text-sm sm:text-base truncate">
                              {category.name}
                            </p>
                            <div
                              className="w-12 sm:w-16 h-1.5 sm:h-2 rounded-full mt-1"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => setEditingId(index)}
                            disabled={isSaving}
                            className="p-1.5 sm:p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category, index)}
                            disabled={isSaving}
                            className="p-1.5 sm:p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
</motion.div>

  );
  
}