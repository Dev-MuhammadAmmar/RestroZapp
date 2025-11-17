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
import { Search, Plus, Edit2, Trash2, X, Users, TrendingUp, DollarSign, ShoppingBag, Phone, Mail, MapPin, Loader2 } from 'lucide-react';

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, color, bgColor }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`${color.replace('border-', 'text-')}`} size={24} />
      </div>
    </div>
  </div>
);

// Customer Row Component
const CustomerRow = ({ customer, onEdit, onDelete, formatCurrency, formatDate }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div>
        <div className="font-semibold text-gray-900">{customer.name}</div>
        {customer.address && (
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate max-w-xs">{customer.address}</span>
          </div>
        )}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-1 text-gray-900 mb-1">
        <Phone size={14} className="flex-shrink-0" />
        <span className="text-sm">{customer.phoneNumber}</span>
      </div>
      {customer.email && (
        <div className="flex items-center gap-1 text-gray-500">
          <Mail size={14} className="flex-shrink-0" />
          <span className="text-sm truncate max-w-xs">{customer.email}</span>
        </div>
      )}
    </td>
    <td className="px-6 py-4">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        {customer.orderCount || 0}
      </span>
    </td>
    <td className="px-6 py-4">
      <span className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent || 0)}</span>
    </td>
    <td className="px-6 py-4 text-sm text-gray-600">
      {formatDate(customer.lastOrderDate)}
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center justify-end gap-2">
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
const EmptyState = ({ onAddClick }) => (
  <div className="text-center py-20">
    <Users className="mx-auto text-gray-400 mb-4" size={48} />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">No customers found</h3>
    <p className="text-gray-500 mb-6">Start by adding your first customer</p>
    <button
      onClick={onAddClick}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
    >
      <Plus size={20} />
      Add Customer
    </button>
  </div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="animate-spin text-blue-600" size={48} />
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
    <div className="w-[92vw] md:w-[100%] bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage and track your customer relationships</p>
        </header>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between animate-fade-in">
            <span className="font-medium">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')} 
              className="text-green-600 hover:text-green-800 transition-colors"
              aria-label="Close message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Customer statistics">
            <StatCard 
              label="Total Customers" 
              value={stats.totalCustomers} 
              icon={Users} 
              color="border-blue-500" 
              bgColor="bg-blue-100" 
            />
            <StatCard 
              label="Total Revenue" 
              value={formatCurrency(stats.totalRevenue)} 
              icon={DollarSign} 
              color="border-green-500" 
              bgColor="bg-green-100" 
            />
            <StatCard 
              label="Avg Orders" 
              value={stats.averageOrdersPerCustomer.toFixed(1)} 
              icon={ShoppingBag} 
              color="border-purple-500" 
              bgColor="bg-purple-100" 
            />
            <StatCard 
              label="Avg Spending" 
              value={formatCurrency(stats.averageSpendPerCustomer)} 
              icon={TrendingUp} 
              color="border-orange-500" 
              bgColor="bg-orange-100" 
            />
          </section>
        )}

        {/* Search and Add Button */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <input
                type="search"
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                aria-label="Search customers"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/30 whitespace-nowrap"
              aria-label="Add new customer"
            >
              <Plus size={20} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <section className="bg-white rounded-xl shadow-md overflow-hidden" aria-label="Customers list">
          {loading ? (
            <LoadingSpinner />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState onAddClick={() => openModal()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Order</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <CustomerRow
                      key={customer._id}
                      customer={customer}
                      onEdit={openModal}
                      onDelete={handleDelete}
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

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg" role="alert">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="customer-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                  placeholder="Enter customer name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="phone-number" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                  placeholder="+92 300 1234567"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                  placeholder="customer@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
                  rows="2"
                  placeholder="Enter customer address"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
                  rows="3"
                  placeholder="Add any additional notes..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {editingCustomer ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCustomer ? 'Update Customer' : 'Create Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}