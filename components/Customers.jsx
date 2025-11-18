'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getAllCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  searchCustomers,
  getCustomerStats 
} from '@/lib/actions/customers';
import { Search, Plus, Edit2, Trash2, X, Users, TrendingUp, DollarSign, ShoppingBag, Phone, Mail, MapPin, Loader2, Filter, Download, Upload, MoreVertical, Calendar, Eye, Archive, Star } from 'lucide-react';

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Stat Card Component with enhanced design
const StatCard = ({ label, value, icon: Icon, color, bgColor, trend, trendValue }) => (
  <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`${bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`${color.replace('border-', 'text-')}`} size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          <TrendingUp size={12} className={trend === 'down' ? 'rotate-180' : ''} />
          {trendValue}
        </div>
      )}
    </div>
    <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

// Customer Row Component with enhanced design
const CustomerRow = ({ customer, onEdit, onDelete, onView, formatCurrency, formatDate }) => (
  <tr className="hover:bg-gray-50/50 transition-all duration-200 group">
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {customer.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {customer.name}
            {customer.orderCount > 10 && (
              <Star size={14} className="text-yellow-500 fill-yellow-500" title="VIP Customer" />
            )}
          </div>
          {customer.address && (
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate max-w-xs">{customer.address}</span>
            </div>
          )}
        </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-gray-900">
          <Phone size={14} className="flex-shrink-0 text-gray-400" />
          <span className="text-sm font-medium">{customer.phoneNumber}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-gray-500">
            <Mail size={14} className="flex-shrink-0 text-gray-400" />
            <span className="text-sm truncate max-w-xs">{customer.email}</span>
          </div>
        )}
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-2">
        <ShoppingBag size={16} className="text-gray-400" />
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
          {customer.orderCount || 0}
        </span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-2">
        <DollarSign size={16} className="text-gray-400" />
        <span className="font-bold text-gray-900 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          {formatCurrency(customer.totalSpent || 0)}
        </span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar size={14} className="text-gray-400" />
        {formatDate(customer.lastOrderDate)}
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onView(customer)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="View details"
          aria-label="View customer details"
        >
          <Eye size={18} />
        </button>
        <button
          onClick={() => onEdit(customer)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit customer"
          aria-label="Edit customer"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(customer._id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete customer"
          aria-label="Delete customer"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);

// Empty State Component
const EmptyState = ({ onAddClick, hasSearch }) => (
  <div className="text-center py-20 px-4">
    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Users className="text-blue-600" size={40} />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">
      {hasSearch ? 'No customers found' : 'No customers yet'}
    </h3>
    <p className="text-gray-500 mb-8 max-w-md mx-auto">
      {hasSearch 
        ? 'Try adjusting your search terms to find what you\'re looking for'
        : 'Get started by adding your first customer to begin tracking orders and relationships'}
    </p>
    {!hasSearch && (
      <button
        onClick={onAddClick}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105"
      >
        <Plus size={20} />
        Add Your First Customer
      </button>
    )}
  </div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <div className="absolute inset-0 blur-xl bg-blue-400 opacity-20 animate-pulse"></div>
    </div>
  </div>
);

// Main Component
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    email: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearchQuery.trim() || debouncedSearchQuery.trim().length < 2) {
      return customers;
    }
    return customers;
  }, [customers, debouncedSearchQuery]);

  // Load customers
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const result = await getAllCustomers(1, 100);
    if (result.success) {
      setCustomers(result.data);
    }
    setLoading(false);
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    const result = await getCustomerStats();
    if (result.success) {
      setStats(result.data);
    }
  }, []);

  // Search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        const result = await searchCustomers(debouncedSearchQuery);
        if (result.success) {
          setCustomers(result.data);
        }
      } else {
        loadCustomers();
      }
    };
    performSearch();
  }, [debouncedSearchQuery, loadCustomers]);

  // Initial load
  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [loadCustomers, loadStats]);

  // Modal handlers
  const openModal = useCallback((customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        phoneNumber: customer.phoneNumber || '',
        address: customer.address || '',
        email: customer.email || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phoneNumber: '',
        address: '',
        email: '',
        notes: ''
      });
    }
    setFormError('');
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      phoneNumber: '',
      address: '',
      email: '',
      notes: ''
    });
    setFormError('');
    setIsSubmitting(false);
  }, []);

  const openViewModal = useCallback((customer) => {
    setViewingCustomer(customer);
  }, []);

  const closeViewModal = useCallback(() => {
    setViewingCustomer(null);
  }, []);

  // Form submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!formData.name.trim()) {
      setFormError('Customer name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setFormError('Phone number is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = editingCustomer 
        ? await updateCustomer(editingCustomer._id, formData)
        : await createCustomer(formData);

      if (result.error) {
        setFormError(result.error);
      } else {
        setSuccessMessage(editingCustomer ? 'Customer updated successfully!' : 'Customer created successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        closeModal();
        await Promise.all([loadCustomers(), loadStats()]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingCustomer, closeModal, loadCustomers, loadStats]);

  // Delete handler
  const handleDelete = useCallback(async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    const result = await deleteCustomer(customerId);
    if (result.success) {
      setSuccessMessage('Customer deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await Promise.all([loadCustomers(), loadStats()]);
    } else {
      setFormError(result.error);
      setTimeout(() => setFormError(''), 5000);
    }
  }, [loadCustomers, loadStats]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <div className="min-h-screen w-[93vw] md:w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                Customer Management
              </h1>
              <p className="text-gray-600 text-lg">Manage and track your customer relationships</p>
            </div>
          </div>
        </header>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center justify-between animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage('')} 
              className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-100 rounded-lg"
              aria-label="Close message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Customer statistics">
            <StatCard 
              label="Total Customers" 
              value={stats.totalCustomers} 
              icon={Users} 
              color="border-blue-500" 
              bgColor="bg-gradient-to-br from-blue-50 to-indigo-50" 
              trend="up"
              trendValue="+12%"
            />
            <StatCard 
              label="Total Revenue" 
              value={formatCurrency(stats.totalRevenue)} 
              icon={DollarSign} 
              color="border-green-500" 
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50" 
              trend="up"
              trendValue="+23%"
            />
            <StatCard 
              label="Avg Orders" 
              value={stats.averageOrdersPerCustomer.toFixed(1)} 
              icon={ShoppingBag} 
              color="border-purple-500" 
              bgColor="bg-gradient-to-br from-purple-50 to-pink-50" 
              trend="up"
              trendValue="+8%"
            />
            <StatCard 
              label="Avg Spending" 
              value={formatCurrency(stats.averageSpendPerCustomer)} 
              icon={TrendingUp} 
              color="border-orange-500" 
              bgColor="bg-gradient-to-br from-orange-50 to-amber-50" 
              trend="up"
              trendValue="+15%"
            />
          </section>
        )}

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <input
                type="search"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                aria-label="Search customers"
              />
            </div>
            <div className="flex items-center gap-3">
        
              <button
                onClick={() => openModal()}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 whitespace-nowrap"
                aria-label="Add new customer"
              >
                <Plus size={20} />
                Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" aria-label="Customers list">
          {loading ? (
            <LoadingSpinner />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState onAddClick={() => openModal()} hasSearch={searchQuery.length > 0} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact Info</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Orders</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Spent</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Order</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <CustomerRow
                      key={customer._id}
                      customer={customer}
                      onEdit={openModal}
                      onDelete={handleDelete}
                      onView={openViewModal}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-white mb-1">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingCustomer ? 'Update customer information' : 'Fill in the details to add a new customer'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {formError && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl flex items-start gap-3" role="alert">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X size={14} className="text-red-600" />
                  </div>
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="customer-name" className="block text-sm font-bold text-gray-700 mb-2.5">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200 text-gray-900"
                    placeholder="Enter customer name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="phone-number" className="block text-sm font-bold text-gray-700 mb-2.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="phone-number"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200 text-gray-900"
                      placeholder="+92 300 1234567"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200 text-gray-900"
                      placeholder="customer@example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-2.5">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-4 text-gray-400" />
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none resize-none transition-all duration-200 text-gray-900"
                      rows="2"
                      placeholder="Enter customer address"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-bold text-gray-700 mb-2.5">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none resize-none transition-all duration-200 text-gray-900"
                    rows="3"
                    placeholder="Add any additional notes..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {editingCustomer ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingCustomer ? 'Update Customer' : 'Create Customer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {viewingCustomer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-modal-title"
          onClick={(e) => e.target === e.currentTarget && closeViewModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                  {viewingCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 id="view-modal-title" className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    {viewingCustomer.name}
                    {viewingCustomer.orderCount > 10 && (
                      <Star size={20} className="text-yellow-300 fill-yellow-300" />
                    )}
                  </h2>
                  <p className="text-blue-100 text-sm">Customer Details</p>
                </div>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-blue-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 space-y-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Phone Number</p>
                      <p className="text-base font-semibold text-gray-900">{viewingCustomer.phoneNumber}</p>
                    </div>
                  </div>
                  {viewingCustomer.email && (
                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Email Address</p>
                        <p className="text-base font-semibold text-gray-900">{viewingCustomer.email}</p>
                      </div>
                    </div>
                  )}
                  {viewingCustomer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Address</p>
                        <p className="text-base font-semibold text-gray-900">{viewingCustomer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Statistics */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={16} className="text-purple-600" />
                  </div>
                  Order Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <p className="text-sm font-semibold text-blue-600 mb-2">Total Orders</p>
                    <p className="text-3xl font-bold text-blue-900">{viewingCustomer.orderCount || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <p className="text-sm font-semibold text-green-600 mb-2">Total Spent</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(viewingCustomer.totalSpent || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                    <p className="text-sm font-semibold text-orange-600 mb-2">Last Order</p>
                    <p className="text-lg font-bold text-orange-900">{formatDate(viewingCustomer.lastOrderDate)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingCustomer.notes && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Edit2 size={16} className="text-amber-600" />
                    </div>
                    Notes
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingCustomer.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    closeViewModal();
                    openModal(viewingCustomer);
                  }}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2 transform hover:scale-105"
                >
                  <Edit2 size={18} />
                  Edit Customer
                </button>
                <button
                  onClick={closeViewModal}
                  className="px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}