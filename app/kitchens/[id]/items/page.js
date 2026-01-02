// app/kitchens/[id]/items/page.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, X, CheckCircle, AlertCircle, 
  ArrowLeft, Package, Filter, ChevronDown,
  Trash2, ChefHat
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

import { getKitchenById, addItemsToKitchen, removeItemsFromKitchen } from '@/lib/actions/kitchens';
import { getActiveMenuItems } from '@/lib/actions/menuItems';
import { getCategories } from '@/lib/actions/categories';

export default function KitchenItemsPage() {
  const router = useRouter();
  const params = useParams();
  const kitchenId = params.id;

  const [kitchen, setKitchen] = useState(null);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [kitchenId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kitchenRes, itemsRes, categoriesRes] = await Promise.all([
        getKitchenById(kitchenId),
        getActiveMenuItems(),
        getCategories(),
      ]);

      if (kitchenRes.success) {
        setKitchen(kitchenRes.data);
      } else {
        showNotification(kitchenRes.error, 'error');
        router.push('/kitchens');
      }

      if (itemsRes.success) {
        setAllMenuItems(itemsRes.data);
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

  const currentItemIds = kitchen?.menuItems?.map(item => 
    typeof item === 'object' ? item._id : item
  ) || [];

 // Only show items that are active AND (not assigned to any kitchen OR assigned to current kitchen)
const availableItems = allMenuItems.filter(item => {
  const notInCurrentKitchen = !currentItemIds.includes(item._id);
  const notInAnyOtherKitchen = !item.kitchenId || item.kitchenId === kitchenId;
  return notInCurrentKitchen && notInAnyOtherKitchen;
});

  const filteredAvailableItems = availableItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      item.categoryId?._id === selectedCategory || 
      item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCurrentItems = (kitchen?.menuItems || []).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      item.categoryId?._id === selectedCategory || 
      item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const itemsToSelect = isAddMode ? filteredAvailableItems : filteredCurrentItems;
    const allIds = itemsToSelect.map(item => item._id);
    
    if (selectedItems.length === allIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleAddItems = async () => {
    if (selectedItems.length === 0) return;
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await addItemsToKitchen(kitchenId, selectedItems);
      
      if (result.success) {
        setKitchen(result.data);
        setSelectedItems([]);
        setIsAddMode(false);
        showNotification(result.message || 'Items added successfully', 'success');
      } else {
        showNotification(result.error, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItems = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Remove ${selectedItems.length} item(s) from this kitchen?`)) return;
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await removeItemsFromKitchen(kitchenId, selectedItems);
      
      if (result.success) {
        setKitchen(result.data);
        setSelectedItems([]);
        showNotification(result.message || 'Items removed successfully', 'success');
      } else {
        showNotification(result.error, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryById = (categoryId) => {
    if (typeof categoryId === 'object') {
      return categoryId;
    }
    return categories.find(cat => cat._id === categoryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#10b981] mx-auto mb-4"></div>
          <p className="text-[#64748b] font-medium">Loading kitchen...</p>
        </div>
      </div>
    );
  }

  if (!kitchen) {
    return null;
  }

  const itemsToDisplay = isAddMode ? filteredAvailableItems : filteredCurrentItems;
  const allDisplayedIds = itemsToDisplay.map(item => item._id);
  const allSelected = selectedItems.length > 0 && selectedItems.length === allDisplayedIds.length;

  return (
    <div className="min-h-screen w-full bg-[#f5f7fa] p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[100%] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <button
            onClick={() => router.push('/kitchens')}
            className="flex items-center gap-2 text-[#64748b] hover:text-[#1e293b] mb-4 transition-all"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back to Kitchens</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl sm:text-5xl">{kitchen.icon}</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1e293b]">
                    {kitchen.name}
                  </h1>
                  {kitchen.description && (
                    <p className="text-sm sm:text-base text-[#64748b] mt-1">
                      {kitchen.description}
                    </p>
                  )}
                </div>
              </div>
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#10b981]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Current Items</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {kitchen.menuItems?.length || 0}
                </p>
              </div>
              <div className="bg-[#10b981] p-2 sm:p-3 rounded-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#8b5cf6]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Available</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {availableItems.length}
                </p>
              </div>
              <div className="bg-[#8b5cf6] p-2 sm:p-3 rounded-lg">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#f59e0b]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Selected</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {selectedItems.length}
                </p>
              </div>
              <div className="bg-[#f59e0b] p-2 sm:p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border-l-4 border-[#06b6d4]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Categories</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {categories.length}
                </p>
              </div>
              <div className="bg-[#06b6d4] p-2 sm:p-3 rounded-lg">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm mb-4 sm:mb-6"
        >
          {/* Mobile Search */}
          <div className="relative mb-3 sm:mb-4 lg:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search items..."
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
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all text-[#1e293b]"
              />
            </div>

            {/* Mobile Category Filter */}
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

            {/* Desktop Category Filter */}
            <div className="hidden lg:flex gap-2 overflow-x-auto items-center pb-2">
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

            {/* Action Buttons */}
            <div className="flex gap-2 w-full lg:w-auto">
              {!isAddMode && (
                <>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleRemoveItems}
                      disabled={isProcessing}
                      className="flex items-center gap-2 w-max px-3 sm:px-4 py-2 sm:py-3 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Remove ({selectedItems.length})
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsAddMode(true);
                      setSelectedItems([]);
                    }}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium text-sm sm:text-base flex-1 sm:flex-initial justify-center w-max"
                  >
                    <Plus className="w-4 h-4" />
                    Add Items
                  </button>
                </>
              )}

              {isAddMode && (
                <>
                  <button
                    onClick={() => {
                      setIsAddMode(false);
                      setSelectedItems([]);
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-2 w-max px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItems}
                    disabled={selectedItems.length === 0 || isProcessing}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 w-max sm:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4  w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Add ({selectedItems.length})
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Select All */}
          {itemsToDisplay.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#e2e8f0]">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-[#3b82f6] hover:text-[#2563eb] font-medium text-sm sm:text-base"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  allSelected 
                    ? 'bg-[#3b82f6] border-[#3b82f6]' 
                    : 'border-[#cbd5e1]'
                }`}>
                  {allSelected && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                {allSelected ? 'Deselect All' : 'Select All'} ({itemsToDisplay.length})
              </button>
            </div>
          )}
        </motion.div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
          <AnimatePresence>
            {itemsToDisplay.map((item, index) => {
              const category = getCategoryById(item.categoryId);
              const isSelected = selectedItems.includes(item._id);
              
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleToggleItem(item._id)}
                  className={`bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all border-t-4 cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#3b82f6] ring-offset-2' : ''
                  }`}
                  style={{ borderTopColor: category?.color || '#10b981' }}
                >
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl sm:text-4xl">{category?.icon || '🍽️'}</div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-[#3b82f6] border-[#3b82f6]' 
                          : 'border-[#cbd5e1]'
                      }`}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
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

                    <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9]">
                      <span
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: category?.color || '#10b981' }}
                      >
                        {category?.name || 'Other'}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#10b981]">
                        ₨{item.sellingPrice}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {itemsToDisplay.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl"
          >
            <Package className="w-20 h-20 text-[#cbd5e1] mx-auto mb-4" />
            <p className="text-[#64748b] text-lg font-medium">
              {isAddMode ? 'No available items to add' : 'No items in this kitchen'}
            </p>
            <p className="text-[#94a3b8] text-sm mt-2">
              {isAddMode 
                ? 'All items are already added to this kitchen or try adjusting your filters'
                : 'Add menu items to get started'
              }
            </p>
            {!isAddMode && availableItems.length > 0 && (
              <button
                onClick={() => setIsAddMode(true)}
                className="mt-4 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Items
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}