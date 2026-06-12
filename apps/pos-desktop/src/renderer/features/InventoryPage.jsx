// app/inventory/page.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Trash2, DollarSign, Package, 
  Filter, X, ChevronDown,
  Settings, Grid3x3, List, AlertCircle, CheckCircle, 
  Tag, Image as ImageIcon, Upload, Download, RefreshCw, WifiOff
} from 'lucide-react';

// Import server actions
import { getKitchens } from '@/lib/actions/kitchens';
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

// Color palette for categories
const colorPalette = [
  '#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];

async function optimizeMenuImage(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Please select an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB.');
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 520;
    canvas.height = 390;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function InventoryPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Add these with your other state declarations (around line 30)
const [togglingItems, setTogglingItems] = useState(new Set())
const [deletingItems, setDeletingItems] = useState(new Set())
  const [kitchens, setKitchens] = useState([]);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState({
  isOpen: false,
  itemId: null,
  itemName: '',
  itemType: 'item'
});


  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

 const fetchData = async () => {
  setLoading(true);
  try {
    const [itemsRes, categoriesRes, kitchensRes] = await Promise.all([
      getMenuItems(),
      getCategories(),
      getKitchens(), // Add this import at top: import { getKitchens } from '@/lib/actions/kitchens';
    ]);

    if (itemsRes.success) {
      setMenuItems(itemsRes.data);
    }
    if (categoriesRes.success) {
      setCategories(categoriesRes.data);
    }
    if (kitchensRes.success) {
      setKitchens(kitchensRes.data);
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
  const averageSellingPrice = menuItems.length > 0
    ? Math.round(menuItems.reduce((sum, item) => sum + item.sellingPrice, 0) / menuItems.length)
    : 0;
  const totalRevenuePotential = menuItems
    .filter(item => item.isActive)
    .reduce((sum, item) => sum + item.sellingPrice, 0);

const handleToggleActive = async (id) => {
  //  Add to loading set
  setTogglingItems(prev => new Set(prev).add(id))
  
  try {
    const result = await toggleMenuItemStatus(id);
    if (result.success) {
      setMenuItems(menuItems.map(item => 
        item._id === id ? result.data : item
      ));
      showNotification('Item status updated', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } finally {
    //  Remove from loading set
    setTogglingItems(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }
};

const handleDelete = async (id) => {
  const item = menuItems.find(item => item._id === id);
  
  setDeleteConfirmation({
    isOpen: true,
    itemId: id,
    itemName: item?.name || 'this item',
    itemType: 'menu item'
  });
};

const confirmDelete = async () => {
  const id = deleteConfirmation.itemId;
  
  // Close the confirmation modal
  setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '', itemType: 'item' });
  
  //  Add to loading set
  setDeletingItems(prev => new Set(prev).add(id));
  
  try {
    const result = await deleteMenuItem(id);
    if (result.success) {
      setMenuItems(menuItems.filter((item) => item._id !== id));
      showNotification('Item deleted successfully', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } finally {
    //  Remove from loading set
    setDeletingItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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
                Manage your menu items, categories, pricing, and availability
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  const result = await window.restrozapp.dataExport.csv('inventory');
                  showNotification(result.ok ? `Inventory CSV saved to ${result.data.path}` : result.error, result.ok ? 'success' : 'error');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#475569] border border-[#e2e8f0] rounded-lg font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all font-medium shadow-md text-sm sm:text-base"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Manage Categories</span>
                <span className="sm:hidden">Categories</span>
              </button>
            </div>
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
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Average Price</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">₨{averageSellingPrice}</p>
                <p className="text-[#8b5cf6] text-xs sm:text-sm font-medium mt-1">Across all items</p>
              </div>
              <div className="bg-[#8b5cf6] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
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
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Kitchens</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {kitchens.length}
                </p>
                <p className="text-[#06b6d4] text-xs sm:text-sm font-medium mt-1">Configured</p>
              </div>
              <div className="bg-[#06b6d4] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <Tag className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
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
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
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
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
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
                <span className="text-sm sm:text-base w-max">Add Item</span>
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
                      <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-[#f1f5f9]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-300"><ImageIcon className="h-10 w-10" /></div>
                        )}
                      </div>
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category?.color || '#10b981' }} />
                        <div className="flex flex-col gap-2">
                          <span
                            className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: category?.color || '#10b981' }}
                          >
                            {category?.name || 'Other'}
                          </span>
                          {/* After the category badge */}
{item.kitchenId && (
  <span
    className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
    style={{ 
      backgroundColor: `${item.kitchenId.color}20`,
      color: item.kitchenId.color 
    }}
  >
    <span>{item.kitchenId.name}</span>
  </span>
)}
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
                          <span className="font-medium">Prep</span>
                          <span>{item.preparationTime}</span>
                        </div>
                      )}

                      <div className="space-y-2 mb-3 sm:mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm font-medium text-[#64748b]">Price:</span>
                          <span className="text-lg sm:text-xl font-bold text-[#10b981]">
                            ₨{item.sellingPrice}
                          </span>
                        </div>
                      </div>

                     <div className="flex gap-2">
  {/* Activate/Deactivate Button */}
  <button
    onClick={() => handleToggleActive(item._id)}
    disabled={togglingItems.has(item._id) || deletingItems.has(item._id)}
    className={`flex-1 p-2 rounded-lg transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[36px] ${
      item.isActive
        ? 'bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]'
        : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
    } ${togglingItems.has(item._id) || deletingItems.has(item._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {togglingItems.has(item._id) ? (
      <>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        <span className="hidden sm:inline">
          {item.isActive ? 'Deactivating...' : 'Activating...'}
        </span>
      </>
    ) : (
      <span>{item.isActive ? 'Deactivate' : 'Activate'}</span>
    )}
  </button>

  {/* Edit Button */}
  <button
    onClick={() => handleEdit(item)}
    disabled={togglingItems.has(item._id) || deletingItems.has(item._id)}
    className={`p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all ${
      togglingItems.has(item._id) || deletingItems.has(item._id) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
  </button>

  {/* Delete Button */}
  <button
    onClick={() => handleDelete(item._id)}
    disabled={togglingItems.has(item._id) || deletingItems.has(item._id)}
    className={`p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all flex items-center justify-center ${
      togglingItems.has(item._id) || deletingItems.has(item._id) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {deletingItems.has(item._id) ? (
      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current"></div>
    ) : (
      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
    )}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Kitchen</th>
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
                              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[#f1f5f9]">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="grid h-full place-items-center text-slate-300"><ImageIcon className="h-6 w-6" /></div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-[#1e293b]">{item.name}</p>
                                {item.preparationTime && (
                                  <p className="text-xs text-[#94a3b8]">Prep: {item.preparationTime}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
  {item.kitchenId ? (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"
      style={{ 
        backgroundColor: `${item.kitchenId.color}20`,
        color: item.kitchenId.color 
      }}
    >
      <span>{item.kitchenId.name}</span>
    </span>
  ) : (
    <span className="text-[#94a3b8] text-sm">No kitchen</span>
  )}
</td>
                          <td className="px-6 py-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: category?.color || '#10b981' }}
                            >
                              {category?.name || 'Other'}
                            </span>
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
    {/* Activate/Deactivate Button */}
    <button
      onClick={() => handleToggleActive(item._id)}
      disabled={togglingItems.has(item._id) || deletingItems.has(item._id)}
      className={`p-2 rounded-lg transition-all flex items-center justify-center min-w-[36px] ${
        item.isActive
          ? 'bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]'
          : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
      } ${togglingItems.has(item._id) || deletingItems.has(item._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={item.isActive ? 'Deactivate' : 'Activate'}
    >
      {togglingItems.has(item._id) ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <span>{item.isActive ? '◉' : '○'}</span>
      )}
    </button>

    {/* Edit Button */}
    <button
      onClick={() => handleEdit(item)}
      disabled={togglingItems.has(item._id) || deletingItems.has(item._id)}
      className={`p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all ${
        togglingItems.has(item._id) || deletingItems.has(item._id) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Edit"
    >
      <Edit2 className="w-4 h-4" />
    </button>

    {/* Delete Button */}
    <button
      onClick={() => handleDelete(item._id)}
      disabled={togglingItems.has(item._id) || deletingItems.has(item._id)}
      className={`p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all flex items-center justify-center ${
        togglingItems.has(item._id) || deletingItems.has(item._id) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Delete"
    >
      {deletingItems.has(item._id) ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
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
    kitchens={kitchens} // ADD THIS
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


    {/* Delete Confirmation Modal */}
<AnimatePresence>
  {deleteConfirmation.isOpen && (
    <DeleteConfirmation
      isOpen={deleteConfirmation.isOpen}
      onClose={() => setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '', itemType: 'item' })}
      onConfirm={confirmDelete}
      itemName={deleteConfirmation.itemName}
      itemType={deleteConfirmation.itemType}
    />
  )}
</AnimatePresence>
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
function ItemModal({ isOpen, onClose, item, categories, kitchens, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
const [formData, setFormData] = useState(
  item || {
    name: '',
    categoryId: categories[0]?._id || '',
    kitchenId: null, // ADD THIS
    sellingPrice: 0,
    isActive: true,
    description: '',
    preparationTime: '',
    imageUrl: '',
    imageDataUrl: '',
    libraryImageId: '',
    removeImage: false,
  }
);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        categoryId: typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId,
              kitchenId: item.kitchenId ? (typeof item.kitchenId === 'object' ? item.kitchenId._id : item.kitchenId) : null, // ADD THIS

        sellingPrice: item.sellingPrice,
        isActive: item.isActive,
        description: item.description || '',
        preparationTime: item.preparationTime || '',
        imageUrl: item.imageUrl || '',
        imageDataUrl: '',
        libraryImageId: '',
        removeImage: false,
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?._id || '',
        kitchenId: null,
        sellingPrice: 0,
        isActive: true,
        description: '',
        preparationTime: '',
        imageUrl: '',
        imageDataUrl: '',
        libraryImageId: '',
        removeImage: false,
      });
    }
    setImageError('');
  }, [item, categories]);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imageDataUrl = await optimizeMenuImage(file);
      setFormData((current) => ({ ...current, imageDataUrl, imageUrl: imageDataUrl, libraryImageId: '', removeImage: false }));
      setImageError('');
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to process image.');
    }
  };
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

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
    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
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
                Item Photo
              </label>
              <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                <div className="aspect-[4/3] overflow-hidden rounded-lg border-2 border-[#e2e8f0] bg-[#f8fafc]">
                  {formData.imageUrl && !formData.removeImage ? (
                    <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-[#94a3b8]"><ImageIcon size={32} /></div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ecfdf5] px-3 py-2 text-sm font-semibold text-[#047857] hover:bg-[#d1fae5]"
                  >
                    <ImageIcon size={16} />
                    Browse food library
                  </button>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#e0f2fe] px-3 py-2 text-sm font-semibold text-[#0369a1] hover:bg-[#bae6fd]">
                    <Upload size={16} />
                    {formData.imageUrl && !formData.removeImage ? 'Change photo' : 'Choose photo'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} disabled={isSaving} />
                  </label>
                  {formData.imageUrl && !formData.removeImage && (
                    <button
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, imageUrl: '', imageDataUrl: '', libraryImageId: '', removeImage: true }))}
                      className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm font-semibold text-[#dc2626]"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              {imageError && <p className="mt-2 text-xs font-medium text-[#dc2626]">{imageError}</p>}
              <p className="mt-2 text-xs text-[#64748b]">Saved locally as a small offline thumbnail.</p>
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
    Kitchen (Optional)
  </label>
  <div className="relative">
    <select
      disabled={isSaving}
      value={formData.kitchenId || ''}
      onChange={(e) =>
        setFormData({ ...formData, kitchenId: e.target.value || null })
      }
      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
    >
      <option value="">No Kitchen</option>
      {kitchens.map((kitchen) => (
        <option key={kitchen._id} value={kitchen._id}>
          {kitchen.name}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8] pointer-events-none" />
  </div>
  <p className="text-[10px] sm:text-xs text-[#94a3b8] mt-1">
    Assign this item to a kitchen station.
  </p>
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
              Pricing
            </h3>

            <div>
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                  Selling Price (₨) *
                </label>
                <input
                  type="number"
                  required
                  disabled={isSaving}
                  min="0"
                  step="1"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  placeholder="0"
                />
                <p className="text-[10px] sm:text-xs text-[#94a3b8] mt-1">
                  Price shown in POS and receipts
                </p>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gradient-to-br from-[#10b981]/10 via-[#8b5cf6]/10 to-[#3b82f6]/10 p-3 sm:p-4 rounded-xl border-2 border-[#10b981]/20">
              <div>
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
    {isLibraryOpen && (
      <FoodImageLibrary
        onClose={() => setIsLibraryOpen(false)}
        onSelect={(asset) => {
          setFormData((current) => ({
            ...current,
            imageUrl: asset.localUrl,
            imageDataUrl: '',
            libraryImageId: asset.id,
            removeImage: false,
          }));
          setIsLibraryOpen(false);
        }}
      />
    )}
  </motion.div>
</motion.div>
  );
}

const imageCategories = [
  ['all', 'All'], ['popular', 'Popular'], ['pizza', 'Pizza'], ['burgers', 'Burgers'],
  ['desi', 'Desi'], ['bbq', 'BBQ'], ['chicken', 'Chicken'], ['rice', 'Rice'],
  ['pasta', 'Pasta'], ['sandwiches', 'Sandwiches'], ['breakfast', 'Breakfast'],
  ['desserts', 'Desserts'], ['drinks', 'Drinks'],
];

function FoodImageLibrary({ onClose, onSelect }) {
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState({ total: 0, ready: 0, queued: 0, downloading: 0, failed: 0, online: true });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const refresh = async () => {
    const [listResult, statusResult] = await Promise.all([
      window.restrozapp.imageLibrary.list(),
      window.restrozapp.imageLibrary.status(),
    ]);
    if (listResult.ok) setAssets(listResult.data);
    setStatus(statusResult);
  };

  useEffect(() => {
    void refresh();
    return window.restrozapp.imageLibrary.onChanged(() => void refresh());
  }, []);

  const filtered = assets.filter((asset) => {
    const text = `${asset.title} ${asset.tags.join(' ')}`.toLowerCase();
    return (category === 'all' || asset.category === category) && text.includes(query.trim().toLowerCase());
  });
  const progress = status.total ? Math.round((status.ready / status.total) * 100) : 0;

  const choose = async (asset) => {
    if (asset.status === 'ready') return onSelect(asset);
    await window.restrozapp.imageLibrary.download(asset.id);
    await refresh();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Food image library</h3>
          <p className="mt-1 text-sm text-slate-500">Professional photos cached locally for offline use.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X /></button>
      </div>

      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pizza, biryani, burger..." className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3" />
          </div>
          {status.failed > 0 && (
            <button type="button" onClick={() => void window.restrozapp.imageLibrary.retry()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
              <RefreshCw size={15} /> Retry failed
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {imageCategories.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setCategory(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${category === id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
          ))}
        </div>
        <div className="mt-4 rounded-md bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>{status.downloading ? `Downloading ${status.activeTitle || 'photo'}...` : `${status.ready} of ${status.total} photos ready offline`}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} /></div>
          {!status.online && <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700"><WifiOff size={13} /> Download paused. It resumes automatically when internet returns.</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <button key={asset.id} type="button" onClick={() => void choose(asset)} className="overflow-hidden rounded-md border border-slate-200 bg-white text-left transition hover:border-emerald-500 hover:shadow-md">
              <div className="relative aspect-[4/3] bg-slate-100">
                <img src={asset.localUrl || asset.previewUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold ${asset.status === 'ready' ? 'bg-emerald-700 text-white' : asset.status === 'failed' ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-700'}`}>
                  {asset.status === 'ready' ? 'Ready' : asset.status === 'downloading' ? 'Downloading' : asset.status === 'failed' ? 'Retry' : 'Download'}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold text-slate-800">{asset.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">{asset.status === 'ready' ? <CheckCircle size={13} /> : <Download size={13} />}{asset.status === 'ready' ? 'Select photo' : 'Save for offline use'}</p>
              </div>
            </button>
          ))}
        </div>
        {!filtered.length && <div className="grid min-h-52 place-items-center text-sm text-slate-500">No matching food photos.</div>}
        <p className="mt-5 text-center text-xs text-slate-400">Curated photography provided by Unsplash.</p>
      </div>
    </div>
  );
}
// Custom Delete Confirmation Modal Component
function DeleteConfirmation({ isOpen, onClose, onConfirm, itemName, itemType = 'item' }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
              <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#475569] text-base leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-[#1e293b]">"{itemName}"</span>? 
            This {itemType} will be permanently removed from your system.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-[#64748b] hover:bg-[#475569] text-white rounded-lg transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-lg transition-all font-medium shadow-lg flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Yes, Delete
          </button>
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
      setNewCategory({ name: '', color: '#10b981' });
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
                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                            className="px-3 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <span
                            className="h-8 w-8 flex-shrink-0 rounded-lg"
                            style={{ backgroundColor: category.color }}
                          />
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
