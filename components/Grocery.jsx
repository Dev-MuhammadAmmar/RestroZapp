    'use client';
    import React, { useState, useEffect } from 'react';
    import { Package, Edit, Check, Plus, Search, AlertCircle, ShoppingCart, DollarSign, Trash2 } from 'lucide-react';

    // Import your server actions
    import {
    createGroceryPurchase,
    updateGroceryPurchase,
    adjustGroceryQuantity,
    markCreditPaid,
    deleteGroceryPurchase,
    getAllGroceries,
    getUnpaidCredits
    } from '@/lib/actions/groceryActions';
    const GroceryManagement = () => {
    const [groceries, setGroceries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [unpaidCredit, setUnpaidCredit] = useState({ total: 0, count: 0 });
    const [printGrocery, setPrintGrocery] = useState(null);
    
    const [formData, setFormData] = useState({
        itemName: '',
        quantity: '',
        unit: 'kg',
        vendorName: '',
        orderedBy: '',
        orderedByRole: 'Manager',
        totalAmount: '',
        paymentMethod: 'CASH',
        status: 'PENDING',
        notes: ''
    });

    useEffect(() => {
        loadGroceries();
        loadUnpaidCredits();
    }, []);

    const loadGroceries = async () => {
        setLoading(true);
        const result = await getAllGroceries();
        if (result.success) {
        setGroceries(result.data);
        }
        setLoading(false);
    };

    const loadUnpaidCredits = async () => {
        const result = await getUnpaidCredits();
        if (result.success) {
        setUnpaidCredit({ total: result.total, count: result.count });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        totalAmount: parseFloat(formData.totalAmount) || 0
        };

        if (editingId) {
        await updateGroceryPurchase(editingId, data);
        } else {
        await createGroceryPurchase(data);
        }

        resetForm();
        loadGroceries();
        loadUnpaidCredits();
    };

    const handleEdit = (grocery) => {
        setFormData({
        itemName: grocery.itemName,
        quantity: grocery.quantity.toString(),
        unit: grocery.unit,
        vendorName: grocery.vendorName,
        orderedBy: grocery.orderedBy,
        orderedByRole: grocery.orderedByRole,
        totalAmount: grocery.totalAmount.toString(),
        paymentMethod: grocery.paymentMethod,
        status: grocery.status,
        notes: grocery.notes
        });
        setEditingId(grocery._id);
        setShowForm(true);
    };

    const handleMarkCompleted = async (id) => {
        await updateGroceryPurchase(id, { status: 'COMPLETED' });
        loadGroceries();
    };

    const handleMarkPaid = async (id) => {
        const grocery = groceries.find(g => g._id === id);
        const payment = parseFloat(prompt(`Pay amount (Remaining: ₨${grocery.remainingAmount}):`) || '0');
        if (payment > 0) {
        await markCreditPaid(id, payment);
        loadGroceries();
        loadUnpaidCredits();
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this grocery purchase?')) {
        await deleteGroceryPurchase(id);
        loadGroceries();
        loadUnpaidCredits();
        }
    };

    const handlePrint = (grocery) => {
        setPrintGrocery(grocery);
        setTimeout(() => window.print(), 100);
    };

    const resetForm = () => {
        setFormData({
        itemName: '',
        quantity: '',
        unit: 'kg',
        vendorName: '',
        orderedBy: '',
        orderedByRole: 'Manager',
        totalAmount: '',
        paymentMethod: 'CASH',
        status: 'PENDING',
        notes: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const filteredGroceries = groceries.filter(g => {
        const matchesSearch = g.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            g.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || g.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 print:hidden">
            <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-emerald-600" />
                    Grocery Management
                    </h1>
                    <p className="text-slate-600 mt-1">Purchase tracking & credit management</p>
                </div>
                
                {unpaidCredit.count > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                        <p className="text-sm font-medium">Unpaid Credits</p>
                        <p className="text-2xl font-bold">₨{unpaidCredit.total.toFixed(2)}</p>
                        <p className="text-xs">{unpaidCredit.count} pending</p>
                        </div>
                    </div>
                    </div>
                )}
                </div>
            </div>

            {/* Add Button & Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-200 hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    {showForm ? 'Cancel' : 'Add Grocery Purchase'}
                </button>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items or vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    </div>
                    
                    <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    </select>
                </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package className="w-6 h-6 text-emerald-600" />
                    {editingId ? 'Update Grocery Purchase' : 'New Grocery Purchase'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Item Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Item Name *
                        </label>
                        <input
                        type="text"
                        required
                        value={formData.itemName}
                        onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="e.g., Chicken, Vegetables"
                        />
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantity *
                        </label>
                        <div className="flex gap-2">
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="10"
                        />
                        <select
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                            <option value="kg">kg</option>
                            <option value="pcs">pcs</option>
                            <option value="ltr">ltr</option>
                            <option value="box">box</option>
                            <option value="bag">bag</option>
                        </select>
                        </div>
                    </div>

                    {/* Vendor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Vendor Name *
                        </label>
                        <input
                        type="text"
                        required
                        value={formData.vendorName}
                        onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Vendor or supplier name"
                        />
                    </div>

                    {/* Ordered By */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ordered By *
                        </label>
                        <input
                        type="text"
                        required
                        value={formData.orderedBy}
                        onChange={(e) => setFormData({...formData, orderedBy: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Person name"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Role *
                        </label>
                        <select
                        value={formData.orderedByRole}
                        onChange={(e) => setFormData({...formData, orderedByRole: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                        <option value="Owner">Owner</option>
                        <option value="Manager">Manager</option>
                        <option value="Rider">Rider</option>
                        <option value="Staff">Staff</option>
                        </select>
                    </div>

                    {/* Total Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Total Amount
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Leave empty for pending"
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Payment Method *
                        </label>
                        <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                        <option value="CASH">Cash</option>
                        <option value="CREDIT">Credit (Payable)</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status *
                        </label>
                        <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    </div>

                    {/* Notes */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Additional notes or adjustments..."
                    />
                    </div>

                    <div className="flex gap-3">
                    <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
                    >
                        {editingId ? 'Update Purchase' : 'Add Purchase'}
                    </button>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all"
                    >
                        Cancel
                    </button>
                    </div>
                </form>
                </div>
            )}

            {/* Grocery List */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto modern-scrollbar">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Item</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Vendor</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Ordered By</th>
                        <th className="px-4 py-4 text-right text-xs font-semibold text-slate-700 uppercase">Qty</th>
                        <th className="px-4 py-4 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase">Payment</th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase">Status</th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                            Loading groceries...
                        </td>
                        </tr>
                    ) : filteredGroceries.length === 0 ? (
                        <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                            No groceries found
                        </td>
                        </tr>
                    ) : (
                        filteredGroceries.map((grocery) => (
                        <tr key={grocery._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 text-sm text-slate-600">
                            {new Date(grocery.orderDate || grocery.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-4">
                            <p className="font-medium text-slate-900">{grocery.itemName}</p>
                            {grocery.notes && (
                                <p className="text-xs text-slate-500 line-clamp-1">{grocery.notes}</p>
                            )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">{grocery.vendorName}</td>
                            <td className="px-4 py-4">
                            <p className="text-sm text-slate-900">{grocery.orderedBy}</p>
                            <p className="text-xs text-slate-500">{grocery.orderedByRole}</p>
                            </td>
                            <td className="px-4 py-4 text-right">
                            <span className="font-medium text-slate-900">{grocery.quantity} {grocery.unit}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                            <p className="font-bold text-slate-900">₨{grocery.totalAmount.toFixed(2)}</p>
                            {grocery.paymentMethod === 'CREDIT' && grocery.remainingAmount > 0 && (
                                <p className="text-xs text-red-600">Due: ₨{grocery.remainingAmount.toFixed(2)}</p>
                            )}
                            </td>
                            <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                grocery.paymentMethod === 'CASH' 
                                ? 'bg-green-100 text-green-700'
                                : grocery.creditStatus === 'PAID'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                                {grocery.paymentMethod === 'CASH' ? 'Cash' : grocery.creditStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                            </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                grocery.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                                {grocery.status}
                            </span>
                            </td>
                            <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                                <button
                                onClick={() => handleEdit(grocery)}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                title="Edit"
                                >
                                <Edit className="w-4 h-4" />
                                </button>
                                {grocery.status === 'PENDING' && (
                                <button
                                    onClick={() => handleMarkCompleted(grocery._id)}
                                    className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                    title="Mark Completed"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                )}
                                {grocery.paymentMethod === 'CREDIT' && grocery.creditStatus === 'UNPAID' && (
                                <button
                                    onClick={() => handleMarkPaid(grocery._id)}
                                    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                    title="Mark Paid"
                                >
                                    <DollarSign className="w-4 h-4" />
                                </button>
                                )}
                                <button
                                onClick={() => handlePrint(grocery)}
                                className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                                title="Print"
                                >
                                <Package className="w-4 h-4" />
                                </button>
                                <button
                                onClick={() => handleDelete(grocery._id)}
                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Delete"
                                >
                                <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </div>
            </div>
        </div>

        {/* Print Template */}
        {printGrocery && (
            <div className="hidden print:block print-content">
            <div className="receipt-container">
                <div className="text-center border-b-2 border-black pb-1 mb-1">
                <h1 className="text-2xl font-bold">GROCERY PURCHASE</h1>
                <p className="text-xs">Purchase Receipt</p>
                </div>

                <div className="text-xs border-b border-dashed border-black pb-1 mb-1">
                <div className="flex justify-between">
                    <span className="font-bold">Purchase ID:</span>
                    <span className="font-bold">{printGrocery._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(printGrocery.orderDate || printGrocery.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">Item:</span>
                    <span className="font-bold">{printGrocery.itemName}</span>
                </div>
                <div className="flex justify-between">
                    <span>Vendor:</span>
                    <span>{printGrocery.vendorName}</span>
                </div>
                <div className="flex justify-between">
                    <span>Ordered By:</span>
                    <span>{printGrocery.orderedBy} ({printGrocery.orderedByRole})</span>
                </div>
                </div>

                <div className="text-xs mb-1">
                <div className="flex justify-between border-b border-dashed border-gray-400 pb-1 mb-1">
                    <span>Quantity:</span>
                    <span className="font-bold text-base">{printGrocery.quantity} {printGrocery.unit}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-bold">₨{printGrocery.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className={printGrocery.paymentMethod === 'CREDIT' ? 'text-red-600 font-bold' : 'font-bold'}>
                    {printGrocery.paymentMethod}
                    </span>
                </div>
                {printGrocery.paymentMethod === 'CREDIT' && (
                    <>
                    <div className="flex justify-between">
                        <span>Paid:</span>
                        <span>₨{printGrocery.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                        <span className="font-bold">Remaining:</span>
                        <span className="font-bold">₨{printGrocery.remainingAmount.toFixed(2)}</span>
                    </div>
                    </>
                )}
                <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-bold ${printGrocery.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}`}>
                    {printGrocery.status}
                    </span>
                </div>
                </div>

                {printGrocery.notes && (
                <div className="text-xs border-t border-dashed border-black pt-1 mb-1">
                    <p className="font-bold">NOTES:</p>
                    <p className="text-[10px]">{printGrocery.notes}</p>
                </div>
                )}

                <div className="text-center text-xs border-t-2 border-black pt-1">
                <p className="text-[10px]">Print Time: {new Date().toLocaleString()}</p>
                </div>

                <div className="pt-1 border-t text-center border-black mt-1">
                <p className="text-[15px] font-medium">Software By: M.Ammar Shaikh</p>
                <p className="text-[13px] font-[400] break-all">Tel: 0316-0346330 | 0370-2741544</p>
                </div>
            </div>
            </div>
        )}

        {/* Print Styles */}
        <style jsx global>{`
            @media print {
            body * {
                visibility: hidden;
            }
            
            .print-content,
            .print-content * {
                visibility: visible;
            }
            
            .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 66mm;
            }
            
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
            
            .print\\:hidden {
                display: none !important;
            }
            
            @page {
                size: 66mm auto;
                margin: 0;
            }
            
            * {
                box-shadow: none !important;
                text-shadow: none !important;
            }
            }

            .modern-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #10b981 #f1f5f9;
            }

            .modern-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
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
            }

            .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            }
        `}</style>
        </>
    );
    };

    export default GroceryManagement;