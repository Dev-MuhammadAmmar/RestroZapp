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
  '🌮','🍕', // 0'🍗', // 1'🍔', // 2 🍔 '🍟','🌯','🥪','🍽️',

];


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
            <div className="hidden lg:flex gap-2 overflow-x-auto items-center scrollbar-thin scrollbar-thumb-[#94a3b8] scrollbar-track-[#f1f5f9] pb-2">
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
  );
}

// Item Modal Component
function ItemModal({ isOpen, onClose, item, categories, onSave }) {
  const [formData, setFormData] = useState(
    item || {
      name: '',
      categoryId: categories[0]?._id || '',
      costPrice: 0,
      profitMargin: 50,
      sellingPrice: 0,
      isActive: true,
      description: '',
      preparationTime: '',
    }
  );

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        categoryId: typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId,
        costPrice: item.costPrice,
        profitMargin: item.profitMargin,
        sellingPrice: item.sellingPrice,
        isActive: item.isActive,
        description: item.description || '',
        preparationTime: item.preparationTime || '',
      });
    }
  }, [item]);

  const calculateSellingPrice = (cost, margin) => {
    return Math.round(cost / (1 - margin / 100));
  };

  const handleCostChange = (cost) => {
    const sellingPrice = calculateSellingPrice(cost, formData.profitMargin);
    setFormData({ ...formData, costPrice: cost, sellingPrice });
  };

  const handleProfitMarginChange = (margin) => {
    const sellingPrice = calculateSellingPrice(formData.costPrice, margin);
    setFormData({ ...formData, profitMargin: margin, sellingPrice });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const profitAmount = formData.sellingPrice - formData.costPrice;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8"
      >
        <div className="sticky top-0 bg-gradient-to-r from-[#10b981] to-[#059669] text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {item ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              {item ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <p className="text-[#d1fae5] text-sm mt-1">
              Fill in the details below to {item ? 'update' : 'create'} a menu item
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#10b981]" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b]"
                  placeholder="e.g., Beef Burger Deluxe"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Category *
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Preparation Time
                </label>
                <input
                  type="text"
                  value={formData.preparationTime}
                  onChange={(e) =>
                    setFormData({ ...formData, preparationTime: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b]"
                  placeholder="e.g., 10-12 mins"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] resize-none"
                  placeholder="Brief description of the item..."
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4 pt-6 border-t border-[#e2e8f0]">
            <h3 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#10b981]" />
              Pricing & Profit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Cost Price (₨) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => handleCostChange(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-lg font-semibold"
                  placeholder="0"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  💡 Total cost to make this item
                </p>
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Profit Margin (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="1"
                    value={formData.profitMargin}
                    onChange={(e) => handleProfitMarginChange(Number(e.target.value))}
                    className="w-full px-4 py-3 pr-12 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] text-lg font-semibold"
                    placeholder="0"
                  />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.profitMargin}
                  onChange={(e) => handleProfitMarginChange(Number(e.target.value))}
                  className="w-full mt-2"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${formData.profitMargin}%, #e2e8f0 ${formData.profitMargin}%, #e2e8f0 100%)`
                  }}
                />
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-gradient-to-br from-[#10b981]/10 via-[#8b5cf6]/10 to-[#3b82f6]/10 p-6 rounded-xl border-2 border-[#10b981]/20">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-[#64748b] mb-1">Cost Price</p>
                  <p className="text-2xl font-bold text-[#1e293b]">
                    ₨{formData.costPrice}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-[#64748b] mb-1">Profit Amount</p>
                  <p className="text-2xl font-bold text-[#8b5cf6]">
                    ₨{profitAmount}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border-2 border-[#10b981]">
                  <p className="text-sm text-[#64748b] mb-1">Selling Price</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    ₨{formData.sellingPrice}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-[#64748b]">
                  💰 You'll earn <span className="font-bold text-[#8b5cf6]">₨{profitAmount}</span> profit per item 
                  ({formData.profitMargin}% margin)
                </p>
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
            <div>
              <p className="font-medium text-[#1e293b]">Item Status</p>
              <p className="text-sm text-[#64748b]">
                {formData.isActive ? 'Item is active and visible' : 'Item is hidden from menu'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative w-14 h-7 rounded-full transition-all ${
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

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-lg flex items-center justify-center gap-2"
            >
              {item ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Update Item
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Item
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Category Management Modal Component
function CategoryModal({ isOpen, onClose, categories, onSave, onDelete }) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState(null);
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

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
      >
        <div className="sticky top-0 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6" />
              Manage Categories
            </h2>
            <p className="text-[#e9d5ff] text-sm mt-1">
              Add, edit, or remove menu categories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Add New Category */}
          <div className="bg-gradient-to-br from-[#8b5cf6]/10 to-[#3b82f6]/10 p-6 rounded-xl border-2 border-[#8b5cf6]/20">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#8b5cf6]" />
              Add New Category
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-[#1e293b]"
                  placeholder="e.g., Appetizers"
                />
              </div>
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Icon
                </label>
                <select
                  value={newCategory.icon}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, icon: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-2xl"
                >
                  {availableIcons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-sm">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {colorPalette.slice(0, 10).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setNewCategory({ ...newCategory, color })
                      }
                      className={`w-10 h-10 rounded-lg transition-all ${
                        newCategory.color === color
                          ? 'ring-2 ring-offset-2 ring-[#8b5cf6] scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
              className="mt-4 w-full px-6 py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>

          {/* Existing Categories */}
          <div>
            <h3 className="text-lg font-semibold text-[#1e293b] mb-4">
              Existing Categories ({localCategories.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {localCategories.map((category, index) => (
                  <motion.div
                    key={category._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border-2 border-[#e2e8f0] rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    {editingId === index ? (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) =>
                              handleUpdateCategory(index, {
                                name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] text-[#1e293b]"
                          />
                        </div>
                        <div>
                          <select
                            value={category.icon}
                            onChange={(e) =>
                              handleUpdateCategory(index, {
                                icon: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#8b5cf6] text-xl"
                          >
                            {availableIcons.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium"
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{category.icon}</span>
                          <div>
                            <p className="font-semibold text-[#1e293b] text-lg">
                              {category.name}
                            </p>
                            <div
                              className="w-16 h-2 rounded-full mt-1"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(index)}
                            className="p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category, index)}
                            className="p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}