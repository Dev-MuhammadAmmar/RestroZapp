'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Save,
  Lock,
  Building,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Percent,
  MessageSquare,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Key,
  ShieldCheck,
  Loader2,
  Truck,
} from 'lucide-react'
import { getSettings, updateSettings, changePassword } from '@/lib/actions/settings'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  
  // Password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(null)
  
  // Change password modal states
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    phone1: '',
    phone2: '',
    email: '',
    taxPercentage: 0,
    deliveryCharges: 0,
    footerMessage: '',
  })


  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await getSettings()
      if (response.success) {
        setSettings(response.data)
        setFormData({
          restaurantName: response.data.restaurantName || '',
          address: response.data.address || '',
          phone1: response.data.phone1 || '',
          phone2: response.data.phone2 || '',
          email: response.data.email || '',
          taxPercentage: response.data.taxPercentage || 0,
          deliveryCharges: response.data.deliveryCharges || 0,
          footerMessage: response.data.footerMessage || '',
        })
      } else {
        showNotification('Failed to load settings', 'error')
      }
    } catch (error) {
      showNotification('Error loading settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSaveClick = () => {
    setPendingChanges(formData)
    setIsPasswordModalOpen(true)
  }

  const handlePasswordSubmit = async () => {
    if (!password) {
      showNotification('Please enter password', 'error')
      return
    }

    try {
      setIsSaving(true)
      const response = await updateSettings(password, pendingChanges)
      
      if (response.success) {
        setSettings(response.data)
        showNotification('Settings updated successfully!', 'success')
        setIsPasswordModalOpen(false)
        setPassword('')
        setPendingChanges(null)
      } else {
        showNotification(response.error || 'Failed to update settings', 'error')
      }
    } catch (error) {
      showNotification('Error updating settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill all password fields', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error')
      return
    }

    try {
      setIsSaving(true)
      const response = await changePassword(oldPassword, newPassword)
      
      if (response.success) {
        showNotification('Password changed successfully!', 'success')
        setIsChangePasswordModalOpen(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showNotification(response.error || 'Failed to change password', 'error')
      }
    } catch (error) {
      showNotification('Error changing password', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className=" bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto blur-xl opacity-50 animate-pulse"></div>
          </div>
          <p className="text-slate-700 font-bold text-lg">Loading settings...</p>
          <p className="text-slate-500 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">
                  Restaurant Settings
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">
                  Configure your restaurant information
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base"
            >
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
              Change Password
            </button>
          </div>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] mx-auto sm:mx-0 max-w-md"
            >
              <div className={`flex items-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl shadow-2xl backdrop-blur-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                )}
                <span className="font-medium text-sm sm:text-base">{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden"
        >
          <div className="p-6 sm:p-8 lg:p-10 space-y-8">
            {/* Restaurant Info Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Building className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Restaurant Information
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                      placeholder="restaurant@email.com"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Phone 1 *
                  </label>
                  <input
                    type="tel"
                    name="phone1"
                    value={formData.phone1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="03XX-XXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Phone 2 <span className="text-xs text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone2"
                    value={formData.phone2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="03XX-XXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Financial Settings */}
            <div className="space-y-5 pt-6 border-t-2 border-slate-100">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Financial Settings
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    Tax/Service Charge (%)
                  </label>
                  <input
                    type="number"
                    name="taxPercentage"
                    value={formData.taxPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Delivery Charges (₨)
                  </label>
                  <input
                    type="number"
                    name="deliveryCharges"
                    value={formData.deliveryCharges}
                    onChange={handleInputChange}
                    min="0"
                    step="10"
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Settings */}
            <div className="space-y-5 pt-6 border-t-2 border-slate-100">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Receipt Settings
                </h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Footer Message 
                </label>
                <input
                  type="text"
                  name="footerMessage"
                  value={formData.footerMessage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  placeholder="Thank you for your visit!"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <motion.button
                onClick={handleSaveClick}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Save className="w-5 h-5" />
                Save Settings
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Password Verification Modal */}
        <AnimatePresence>
          {isPasswordModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
              onClick={() => !isSaving && setIsPasswordModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
              >
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Verify Password
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Enter your password to save changes
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                      disabled={isSaving}
                      className="w-full pl-11 pr-12 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50"
                      placeholder="Enter password"
                      autoFocus
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPasswordModalOpen(false)}
                    disabled={isSaving}
                    className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isSaving || !password}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Password Modal */}
        <AnimatePresence>
          {isChangePasswordModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
              onClick={() => !isSaving && setIsChangePasswordModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <Key className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Change Password
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Update your account password
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        disabled={isSaving}
                        className="w-full pl-11 pr-12 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50"
                        placeholder="Enter current password"
                      />
                      <button
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                      >
                        {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isSaving}
                        className="w-full pl-11 pr-12 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50"
                        placeholder="Enter new password"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                        disabled={isSaving}
                        className="w-full pl-11 pr-12 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50"
                        placeholder="Confirm new password"
                      />
                      <button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsChangePasswordModalOpen(false)}
                    disabled={isSaving}
                    className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving || !oldPassword || !newPassword || !confirmPassword}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}