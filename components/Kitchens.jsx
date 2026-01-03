// app/kitchens/page.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit2, Trash2, ChefHat, 
  Package, X, CheckCircle, AlertCircle, 
  Sparkles, Settings, ArrowRight, Filter,
  Grid3x3, List
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  getKitchens,
  createKitchen,
  updateKitchen,
  deleteKitchen,
  toggleKitchenStatus,
} from '@/lib/actions/kitchens';

// Color palette for kitchens
const colorPalette = [
  '#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];

// Available emoji icons for kitchens
const kitchenIcons = [
  "🍳","🔥","👨‍🍳","👩‍🍳","🍽️","🥘","🍲","🥗",
  "🍜","🍛","🍱","🥙","🌮","🍕","🍔","🥪",
  "🧆","🥟","🍢","🍡","🧁","🎂","🍰","🥧"
];

export default function KitchensPage() {
  const router = useRouter();
  const [kitchens, setKitchens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showInactive, setShowInactive] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentKitchen, setCurrentKitchen] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
const [togglingKitchens, setTogglingKitchens] = useState(new Set());
const [deletingKitchens, setDeletingKitchens] = useState(new Set());
const [deleteConfirmation, setDeleteConfirmation] = useState({
  isOpen: false,
  kitchenId: null,
  kitchenName: '',
});
  useEffect(() => {
    fetchKitchens();
  }, []);

  const fetchKitchens = async () => {
    setLoading(true);
    try {
      const result = await getKitchens();
      if (result.success) {
        setKitchens(result.data);
      }
    } catch (error) {
      showNotification('Failed to load kitchens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredKitchens = kitchens.filter((kitchen) => {
    const matchesSearch = kitchen.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showInactive || kitchen.isActive;
    return matchesSearch && matchesActive;
  });

  const totalKitchens = kitchens.filter(k => k.isActive).length;
  const totalItems = kitchens.reduce((sum, k) => sum + (k.menuItems?.length || 0), 0);
  const avgItemsPerKitchen = totalKitchens > 0 ? Math.round(totalItems / totalKitchens) : 0;
const handleDelete = async (id) => {
  const kitchen = kitchens.find(k => k._id === id);
  
  setDeleteConfirmation({
    isOpen: true,
    kitchenId: id,
    kitchenName: kitchen?.name || 'this kitchen',
  });
};

const confirmDelete = async () => {
  const id = deleteConfirmation.kitchenId;
  
  // Close the confirmation modal
  setDeleteConfirmation({ isOpen: false, kitchenId: null, kitchenName: '' });
  
  // Add to loading set
  setDeletingKitchens(prev => new Set(prev).add(id));
  
  try {
    const result = await deleteKitchen(id);
    if (result.success) {
      setKitchens(kitchens.filter((k) => k._id !== id));
      showNotification('Kitchen deleted successfully', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } finally {
    // Remove from loading set
    setDeletingKitchens(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
};
 const handleToggleActive = async (id) => {
  // Add to loading set
  setTogglingKitchens(prev => new Set(prev).add(id));
  
  try {
    const result = await toggleKitchenStatus(id);
    if (result.success) {
      setKitchens(kitchens.map(k => 
        k._id === id ? result.data : k
      ));
      showNotification('Kitchen status updated', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } finally {
    // Remove from loading set
    setTogglingKitchens(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
};;

  const handleEdit = (kitchen) => {
    setCurrentKitchen(kitchen);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentKitchen(null);
    setIsAddModalOpen(true);
  };

  const handleSaveKitchen = async (kitchenData) => {
    let result;
    
    if (currentKitchen) {
      result = await updateKitchen(currentKitchen._id, kitchenData);
      if (result.success) {
        setKitchens(kitchens.map((k) => 
          k._id === currentKitchen._id ? result.data : k
        ));
        showNotification('Kitchen updated successfully', 'success');
      }
    } else {
      result = await createKitchen(kitchenData);
      if (result.success) {
        setKitchens([...kitchens, result.data]);
        showNotification('Kitchen created successfully', 'success');
      }
    }

    if (result.error) {
      showNotification(result.error, 'error');
      return;
    }

    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCurrentKitchen(null);
  };

  const handleManageItems = (kitchenId) => {
    router.push(`/kitchens/${kitchenId}/items`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#10b981] mx-auto mb-4"></div>
          <p className="text-[#64748b] font-medium">Loading kitchens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f7fa] p-2 sm:p-4 md:p-6 lg:p-8">
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
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-[#10b981]" />
                Kitchen Management
              </h1>
              <p className="text-sm sm:text-base text-[#64748b]">
                Organize menu items across different kitchen stations
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium shadow-md text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Kitchen
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
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Active Kitchens</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">{totalKitchens}</p>
                <p className="text-[#10b981] text-xs sm:text-sm font-medium mt-1">Stations</p>
              </div>
              <div className="bg-[#10b981] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
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
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Total Items</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">{totalItems}</p>
                <p className="text-[#8b5cf6] text-xs sm:text-sm font-medium mt-1">Assigned</p>
              </div>
              <div className="bg-[#8b5cf6] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
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
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Avg. Items</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">{avgItemsPerKitchen}</p>
                <p className="text-[#f59e0b] text-xs sm:text-sm font-medium mt-1">Per Kitchen</p>
              </div>
              <div className="bg-[#f59e0b] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
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
                <p className="text-[#64748b] text-xs sm:text-sm mb-1">Coverage</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1e293b]">
                  {totalKitchens > 0 ? '100' : '0'}%
                </p>
                <p className="text-[#06b6d4] text-xs sm:text-sm font-medium mt-1">Organized</p>
              </div>
              <div className="bg-[#06b6d4] p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search kitchens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all text-[#1e293b] text-sm sm:text-base"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
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
                onClick={() => setShowInactive(!showInactive)}
                className={`p-2 rounded-lg transition-all ${
                  showInactive
                    ? 'bg-[#f59e0b] text-white shadow-md'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Kitchens Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
            <AnimatePresence>
              {filteredKitchens.map((kitchen, index) => (
                <motion.div
                  key={kitchen._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all border-t-4 ${
                    !kitchen.isActive ? 'opacity-60' : ''
                  }`}
                  style={{ borderTopColor: kitchen.color }}
                >
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="text-3xl sm:text-4xl md:text-5xl">{kitchen.icon}</div>
                      <div className="flex flex-col gap-2">
                        {!kitchen.isActive && (
                          <span className="px-2 sm:px-3 py-1 bg-[#ef4444] text-white rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-2">
                      {kitchen.name}
                    </h3>
                    
                    {kitchen.description && (
                      <p className="text-xs sm:text-sm text-[#64748b] mb-3 line-clamp-2">
                        {kitchen.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
                      <span className="text-xs sm:text-sm text-[#64748b]">Menu Items:</span>
                      <span className="text-lg sm:text-xl font-bold text-[#10b981]">
                        {kitchen.menuItems?.length || 0}
                      </span>
                    </div>
<div className="grid grid-cols-2 gap-2">
  <button
    onClick={() => handleManageItems(kitchen._id)}
    disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
    className={`col-span-2 flex items-center justify-center gap-2 p-2 sm:p-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium text-xs sm:text-sm ${
      togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
    Manage Items
    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
  </button>
  
  <button
    onClick={() => handleToggleActive(kitchen._id)}
    disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
    className={`p-2 rounded-lg transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[36px] ${
      kitchen.isActive
        ? 'bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]'
        : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
    } ${togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {togglingKitchens.has(kitchen._id) ? (
      <>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        <span className="hidden sm:inline">
          {kitchen.isActive ? 'Deactivating...' : 'Activating...'}
        </span>
      </>
    ) : (
      <span>{kitchen.isActive ? 'Deactivate' : 'Activate'}</span>
    )}
  </button>
  
  <button
    onClick={() => handleEdit(kitchen)}
    disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
    className={`p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all ${
      togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" />
  </button>
  
  <button
    onClick={() => handleDelete(kitchen._id)}
    disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
    className={`col-span-2 p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all flex items-center justify-center ${
      togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {deletingKitchens.has(kitchen._id) ? (
      <>
        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current"></div>
        <span className="ml-2 text-xs sm:text-sm">Deleting...</span>
      </>
    ) : (
      <>
        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="ml-1 text-xs sm:text-sm">Delete</span>
      </>
    )}
  </button>
</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Kitchens List */}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Kitchen</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#475569]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredKitchens.map((kitchen, index) => (
                      <motion.tr
                        key={kitchen._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all ${
                          !kitchen.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{kitchen.icon}</span>
                            <p className="font-medium text-[#1e293b]">{kitchen.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#64748b] max-w-xs truncate">
                          {kitchen.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#10b981] font-bold text-lg">
                            {kitchen.menuItems?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {kitchen.isActive ? (
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
      onClick={() => handleManageItems(kitchen._id)}
      disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
      className={`p-2 bg-[#d1fae5] text-[#059669] rounded-lg hover:bg-[#a7f3d0] transition-all ${
        togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Manage Items"
    >
      <Settings className="w-4 h-4" />
    </button>
    
    <button
      onClick={() => handleToggleActive(kitchen._id)}
      disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
      className={`p-2 rounded-lg transition-all flex items-center justify-center min-w-[36px] ${
        kitchen.isActive
          ? 'bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a]'
          : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
      } ${togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={kitchen.isActive ? 'Deactivate' : 'Activate'}
    >
      {togglingKitchens.has(kitchen._id) ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <span>{kitchen.isActive ? '◉' : '○'}</span>
      )}
    </button>
    
    <button
      onClick={() => handleEdit(kitchen)}
      disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
      className={`p-2 bg-[#dbeafe] text-[#3b82f6] rounded-lg hover:bg-[#bfdbfe] transition-all ${
        togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Edit"
    >
      <Edit2 className="w-4 h-4" />
    </button>
    
    <button
      onClick={() => handleDelete(kitchen._id)}
      disabled={togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id)}
      className={`p-2 bg-[#fee2e2] text-[#ef4444] rounded-lg hover:bg-[#fecaca] transition-all flex items-center justify-center ${
        togglingKitchens.has(kitchen._id) || deletingKitchens.has(kitchen._id) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Delete"
    >
      {deletingKitchens.has(kitchen._id) ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  </div>
</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredKitchens.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl"
          >
            <ChefHat className="w-20 h-20 text-[#cbd5e1] mx-auto mb-4" />
            <p className="text-[#64748b] text-lg font-medium">No kitchens found</p>
            <p className="text-[#94a3b8] text-sm mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Create your first kitchen to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Kitchen
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <KitchenModal
            isOpen={isAddModalOpen || isEditModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setCurrentKitchen(null);
            }}
            kitchen={currentKitchen}
            onSave={handleSaveKitchen}
          />
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
<AnimatePresence>
  {deleteConfirmation.isOpen && (
    <DeleteConfirmation
      isOpen={deleteConfirmation.isOpen}
      onClose={() => setDeleteConfirmation({ isOpen: false, kitchenId: null, kitchenName: '' })}
      onConfirm={confirmDelete}
      kitchenName={deleteConfirmation.kitchenName}
    />
  )}
</AnimatePresence>
    </div>

  );
}
// Custom Delete Confirmation Modal Component
function DeleteConfirmation({ isOpen, onClose, onConfirm, kitchenName }) {
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
              ⚠️
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
            Are you sure you want to delete <span className="font-semibold text-[#1e293b]">"{kitchenName}"</span>? 
            This kitchen will be permanently removed. Menu items will not be deleted, but they will no longer be assigned to this kitchen.
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

// Kitchen Modal Component
function KitchenModal({ isOpen, onClose, kitchen, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(
    kitchen || {
      name: '',
      description: '',
      icon: '🍳',
      color: '#10b981',
      isActive: true,
      displayOrder: 0,
    }
  );

  useEffect(() => {
    if (kitchen) {
      setFormData(kitchen);
    }
  }, [kitchen]);

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white p-4 sm:p-6 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              {kitchen ? <Edit2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
              {kitchen ? 'Edit Kitchen' : 'Add New Kitchen'}
            </h2>
            <p className="text-[#d1fae5] text-xs sm:text-sm mt-1">
              {kitchen ? 'Update kitchen information' : 'Create a new kitchen station'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Kitchen Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                disabled={isSaving}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                placeholder="e.g., Hot Kitchen, Cold Station, Grill"
              />
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Description
              </label>
              <textarea
                disabled={isSaving}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base resize-none"
                placeholder="Brief description of this kitchen station (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                  Icon
                </label>
                <select
                  disabled={isSaving}
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {kitchenIcons.map((icon) => (
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
                  className="w-full h-10 sm:h-12 rounded-lg flex items-center justify-center text-3xl font-bold border-2 border-[#e2e8f0]"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.icon}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-2 text-xs sm:text-sm">
                Color Theme
              </label>
              <div className="grid grid-cols-10 gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-full aspect-square rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-[#10b981] scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
              <div>
                <p className="font-medium text-[#1e293b] text-sm sm:text-base">Kitchen Status</p>
                <p className="text-xs sm:text-sm text-[#64748b]">
                  {formData.isActive ? 'Kitchen is active and operational' : 'Kitchen is inactive'}
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

            {/* Action Buttons */}
            <div className="flex gap-3 sm:gap-4 pt-4 border-t border-[#e2e8f0]">
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
                ) : kitchen ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Update Kitchen
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Create Kitchen
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