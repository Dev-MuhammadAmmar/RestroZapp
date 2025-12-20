  'use server';
  import dbConnect from '../db';
  import GroceryPurchase from '@/models/GroceryPurchase';
// Add this import at the top
import Vendor from '@/models/Vendor';
// AUTO-CREATE VENDOR if not exists
async function ensureVendorExists(vendorName, vendorContact = '') {
  try {
    let vendor = await Vendor.findOne({ 
      vendorName: { $regex: new RegExp(`^${vendorName}$`, 'i') }
    });
    
    if (!vendor) {
      vendor = await Vendor.create({
        vendorName: vendorName.trim(),
        phoneNumber: vendorContact || 'N/A'
      });
      console.log(`✓ Auto-created vendor: ${vendorName}`);
    }
    
    return vendor;
  } catch (error) {
    console.error('Ensure vendor exists error:', error);
    return null;
  }
}
// Add this helper function
async function syncVendorStatsHelper(vendorName) {
  try {
    const vendor = await Vendor.findOne({ vendorName });
    if (!vendor) return;
    
    const purchases = await GroceryPurchase.find({ 
      vendorName: vendorName,
      isArchived: false 
    }).lean();
    
    const stats = {
      totalOrders: purchases.length,
      totalPurchaseValue: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      totalPaid: purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalPending: purchases.reduce((sum, p) => sum + p.remainingAmount, 0),
      lastOrderDate: purchases.length > 0 ? 
        purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : 
        null
    };
    
    await Vendor.findOneAndUpdate(
      { vendorName },
      { $set: stats }
    );
  } catch (error) {
    console.error('Sync vendor stats helper error:', error);
  }
}

export async function createGroceryPurchase(data) {
  try {
    await dbConnect();
    
    // ✅ AUTO-CREATE VENDOR if needed
    await ensureVendorExists(data.vendorName, data.vendorContact);
    
    const grocery = await GroceryPurchase.create(data);
    
    // Sync vendor stats
    await syncVendorStatsHelper(data.vendorName);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(grocery.toObject()))
    };
  } catch (error) {
    console.error('Create grocery error:', error);
    return { success: false, error: error.message };
  }
}

// Also add sync to markCreditPaid function after successful payment
  /**
   * Create a new grocery purchase

  /**
   * Update an existing grocery purchase
   */
  /**
   * Update an existing grocery purchase
   */
  export async function updateGroceryPurchase(id, data) {
    try {
      await dbConnect();
      
      const grocery = await GroceryPurchase.findById(id);
      
      if (!grocery) {
        return { success: false, error: 'Grocery purchase not found' };
      }
      
      // If quantity or unitPrice changed, recalculate totalAmount
      if (data.quantity !== undefined || data.unitPrice !== undefined) {
        const newQuantity = data.quantity !== undefined ? Number(data.quantity) : grocery.quantity;
        const newUnitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : grocery.unitPrice;
        
        if (newQuantity && newUnitPrice) {
          data.totalAmount = newQuantity * newUnitPrice;
        }
      }
      
      // If totalAmount changed and payment method is CREDIT/BANK_TRANSFER, recalculate remaining
      if (data.totalAmount !== undefined && (grocery.paymentMethod === 'CREDIT' || grocery.paymentMethod === 'BANK_TRANSFER')) {
        const currentPaid = Number(grocery.paidAmount) || 0;
        data.remainingAmount = Math.max(0, Number(data.totalAmount) - currentPaid);
        
        // Update credit status
        if (data.remainingAmount <= 0.01) {
          data.creditStatus = 'PAID';
          data.remainingAmount = 0;
        } else if (currentPaid > 0) {
          data.creditStatus = 'PARTIAL';
        } else {
          data.creditStatus = 'UNPAID';
        }
      }
      
      // Update the document
      Object.keys(data).forEach(key => {
        grocery[key] = data[key];
      });
      
      // Mark modified fields
      grocery.markModified('totalAmount');
      grocery.markModified('remainingAmount');
      grocery.markModified('creditStatus');
      
      await grocery.save();
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(grocery.toObject()))
      };
    } catch (error) {
      console.error('Update grocery error:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Mark credit payment (full or partial)
   */
  /**
   * Mark credit payment (full or partial)
   */
  /**
   * Mark credit payment (full or partial)
   */
  export async function markCreditPaid(id, paymentAmount, paymentMethod = 'CASH', note = '', paidBy = '') {
    try {
      await dbConnect();
      
      const grocery = await GroceryPurchase.findById(id);
      if (!grocery) {
        return { success: false, error: 'Grocery purchase not found' };
      }
      
      if (grocery.paymentMethod !== 'CREDIT' && grocery.paymentMethod !== 'BANK_TRANSFER') {
        return { success: false, error: 'This is not a credit/bank transfer purchase' };
      }
      
      const amount = Number(paymentAmount);
      
      if (isNaN(amount) || amount <= 0) {
        return { success: false, error: 'Payment amount must be greater than 0' };
      }
      
      // Calculate current remaining amount
      const currentPaid = Number(grocery.paidAmount) || 0;
      const currentRemaining = Number(grocery.totalAmount) - currentPaid;
      
      if (amount > currentRemaining + 0.01) {
        return { 
          success: false, 
          error: `Payment amount (₨${amount}) exceeds remaining balance (₨${currentRemaining.toFixed(2)})` 
        };
      }
      
      // Calculate new amounts
      const newPaidAmount = currentPaid + amount;
      const newRemainingAmount = Math.max(0, grocery.totalAmount - newPaidAmount);
      
      // Add to payment history with paidBy
      grocery.paymentHistory.push({
        amount: amount,
        date: new Date(),
        method: paymentMethod,
        note: note || '',
        paidBy: paidBy || 'Unknown'  // NEW FIELD
      });
      
      // Update fields
      grocery.paidAmount = newPaidAmount;
      grocery.remainingAmount = newRemainingAmount;
      
      // Update credit status
      if (newRemainingAmount <= 0.01) {
        grocery.creditStatus = 'PAID';
        grocery.remainingAmount = 0;
        if (grocery.status === 'RECEIVED') {
          grocery.status = 'COMPLETED';
        }
      } else {
        grocery.creditStatus = 'PARTIAL';
      }
      
      // Mark fields as modified
      grocery.markModified('paidAmount');
      grocery.markModified('remainingAmount');
      grocery.markModified('creditStatus');
      grocery.markModified('paymentHistory');
      
      await grocery.save();
      await syncVendorStatsHelper(grocery.vendorName);

      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(grocery.toObject())),
        message: `Payment of ₨${amount.toFixed(2)} recorded successfully. Remaining: ₨${newRemainingAmount.toFixed(2)}`
      };
    } catch (error) {
      console.error('Mark credit paid error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a grocery purchase
   */
  export async function deleteGroceryPurchase(id) {
    try {
      await dbConnect();
      
      const result = await GroceryPurchase.findByIdAndDelete(id);
      if (!result) {
        return { success: false, error: 'Grocery purchase not found' };
      }
      
      return { success: true, message: 'Grocery purchase deleted successfully' };
    } catch (error) {
      console.error('Delete grocery error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Archive a grocery purchase
   */
  export async function archiveGroceryPurchase(id) {
    try {
      await dbConnect();
      
      const grocery = await GroceryPurchase.findByIdAndUpdate(
        id,
        { isArchived: true },
        { new: true }
      );
      
      if (!grocery) {
        return { success: false, error: 'Grocery purchase not found' };
      }
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(grocery.toObject())),
        message: 'Grocery purchase archived successfully'
      };
    } catch (error) {
      console.error('Archive grocery error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore archived grocery purchase
   */
  export async function restoreGroceryPurchase(id) {
    try {
      await dbConnect();
      
      const grocery = await GroceryPurchase.findByIdAndUpdate(
        id,
        { isArchived: false },
        { new: true }
      );
      
      if (!grocery) {
        return { success: false, error: 'Grocery purchase not found' };
      }
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(grocery.toObject())),
        message: 'Grocery purchase restored successfully'
      };
    } catch (error) {
      console.error('Restore grocery error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all groceries with optional filters
   */
export async function getAllGroceries(filters = {}) {
  try {
    await dbConnect();
    
    const query = { isArchived: false, ...filters };
    
    // OPTIMIZE: Only fetch necessary fields initially
    const groceries = await GroceryPurchase.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // LIMIT initial fetch to 100 records
      .lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(groceries))
    };
  } catch (error) {
    console.error('Get all groceries error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

  /**
   * Get archived groceries
   */
  export async function getArchivedGroceries() {
    try {
      await dbConnect();
      
      const groceries = await GroceryPurchase.find({ isArchived: true })
        .sort({ createdAt: -1 })
        .lean();
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(groceries))
      };
    } catch (error) {
      console.error('Get archived groceries error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get unpaid credits summary
   */
  export async function getUnpaidCredits() {
    try {
      await dbConnect();
      
      const unpaid = await GroceryPurchase.find({ 
        paymentMethod: { $in: ['CREDIT', 'BANK_TRANSFER'] },
        creditStatus: { $in: ['UNPAID', 'PARTIAL'] },
        remainingAmount: { $gt: 0 },
        isArchived: false
      }).lean();
      
      const total = unpaid.reduce((sum, g) => sum + (g.remainingAmount || 0), 0);
      
      return { 
        success: true, 
        total: parseFloat(total.toFixed(2)), 
        count: unpaid.length,
        overdueCount: 0,
        overdueAmount: 0,
        details: JSON.parse(JSON.stringify(unpaid))
      };
    } catch (error) {
      console.error('Get unpaid credits error:', error);
      return { success: false, error: error.message, total: 0, count: 0 };
    }
  }

  /**
   * Get comprehensive grocery statistics
   */
  export async function getGroceryStats(period = 'all') {
    try {
      await dbConnect();
      
      let dateFilter = {};
      const now = new Date();
      
      switch(period) {
        case 'today':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.setHours(0, 0, 0, 0))
            }
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { createdAt: { $gte: monthStart } };
          break;
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter = { createdAt: { $gte: yearStart } };
          break;
      }
      
      const allGroceries = await GroceryPurchase.find({
        isArchived: false,
        ...dateFilter
      }).lean();
      
      const stats = {
        totalPurchases: allGroceries.length,
        totalSpent: allGroceries.reduce((sum, g) => sum + g.totalAmount, 0),
        totalPaid: allGroceries.reduce((sum, g) => sum + (g.paidAmount || 0), 0),
        totalPending: allGroceries.reduce((sum, g) => sum + g.remainingAmount, 0),
        
        pendingOrders: allGroceries.filter(g => g.status === 'PENDING').length,
        receivedOrders: allGroceries.filter(g => g.status === 'RECEIVED').length,
        completedOrders: allGroceries.filter(g => g.status === 'COMPLETED').length,
        cancelledOrders: allGroceries.filter(g => g.status === 'CANCELLED').length,
        
        cashPurchases: allGroceries.filter(g => g.paymentMethod === 'CASH').length,
        creditPurchases: allGroceries.filter(g => g.paymentMethod === 'CREDIT').length,
        bankTransfers: allGroceries.filter(g => g.paymentMethod === 'BANK_TRANSFER').length,
        
        cashAmount: allGroceries
          .filter(g => g.paymentMethod === 'CASH')
          .reduce((sum, g) => sum + g.totalAmount, 0),
        creditAmount: allGroceries
          .filter(g => g.paymentMethod === 'CREDIT')
          .reduce((sum, g) => sum + g.totalAmount, 0),
        
        avgOrderValue: allGroceries.length > 0 
          ? allGroceries.reduce((sum, g) => sum + g.totalAmount, 0) / allGroceries.length 
          : 0,
        
        topVendors: getTopVendors(allGroceries, 5),
        topCategories: getTopCategories(allGroceries, 5)
      };
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(stats))
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  function getTopVendors(groceries, limit) {
    const vendorMap = {};
    groceries.forEach(g => {
      if (!vendorMap[g.vendorName]) {
        vendorMap[g.vendorName] = { name: g.vendorName, total: 0, count: 0 };
      }
      vendorMap[g.vendorName].total += g.totalAmount;
      vendorMap[g.vendorName].count += 1;
    });
    
    return Object.values(vendorMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  function getTopCategories(groceries, limit) {
    const categoryMap = {};
    groceries.forEach(g => {
      if (!categoryMap[g.category]) {
        categoryMap[g.category] = { name: g.category, total: 0, count: 0 };
      }
      categoryMap[g.category].total += g.totalAmount;
      categoryMap[g.category].count += 1;
    });
    
    return Object.values(categoryMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  /**
   * Get unique vendors list with stats
   */
  export async function getVendorsList() {
    try {
      await dbConnect();
      
      const vendors = await GroceryPurchase.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: '$vendorName',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            lastOrder: { $max: '$createdAt' },
            contact: { $first: '$vendorContact' }
          }
        },
        { $sort: { totalSpent: -1 } }
      ]);
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(vendors))
      };
    } catch (error) {
      console.error('Get vendors error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get vendor analysis report
   */
  export async function getVendorAnalysis() {
    try {
      await dbConnect();
      
      const analysis = await GroceryPurchase.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: '$vendorName',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            pendingCredit: {
              $sum: {
                $cond: [
                  { $gt: ['$remainingAmount', 0] },
                  '$remainingAmount',
                  0
                ]
              }
            },
            lastOrderDate: { $max: '$createdAt' }
          }
        },
        { $sort: { totalSpent: -1 } }
      ]);
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(analysis))
      };
    } catch (error) {
      console.error('Get vendor analysis error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get category analysis
   */
  export async function getCategoryAnalysis(startDate, endDate) {
    try {
      await dbConnect();
      
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const analysis = await GroceryPurchase.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            isArchived: false
          }
        },
        {
          $group: {
            _id: '$category',
            totalSpent: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' },
            itemCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } }
      ]);
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(analysis))
      };
    } catch (error) {
      console.error('Get category analysis error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get monthly spending trend
   */
  export async function getMonthlyTrend(months = 6) {
    try {
      await dbConnect();
      
      const trends = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const groceries = await GroceryPurchase.find({
          createdAt: { $gte: date, $lt: nextMonth },
          isArchived: false
        }).lean();
        
        const monthData = {
          month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          totalSpent: groceries.reduce((sum, g) => sum + g.totalAmount, 0),
          totalPurchases: groceries.length,
          cashPurchases: groceries.filter(g => g.paymentMethod === 'CASH').reduce((sum, g) => sum + g.totalAmount, 0),
          creditPurchases: groceries.filter(g => g.paymentMethod === 'CREDIT').reduce((sum, g) => sum + g.totalAmount, 0),
          pendingAmount: groceries.reduce((sum, g) => sum + g.remainingAmount, 0)
        };
        
        trends.push(monthData);
      }
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(trends))
      };
    } catch (error) {
      console.error('Get monthly trend error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get pending orders
   */
  export async function getPendingOrders() {
    try {
      await dbConnect();
      
      const pending = await GroceryPurchase.find({
        status: { $in: ['PENDING', 'RECEIVED'] },
        isArchived: false
      }).sort({ createdAt: 1 }).lean();
      
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(pending))
      };
    } catch (error) {
      console.error('Get pending orders error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Bulk status update
   */
  export async function bulkUpdateStatus(ids, status) {
    try {
      await dbConnect();
      
      const result = await GroceryPurchase.updateMany(
        { _id: { $in: ids } },
        { status }
      );
      
      return { 
        success: true, 
        message: `${result.modifiedCount} purchase(s) updated successfully`
      };
    } catch (error) {
      console.error('Bulk update error:', error);
      return { success: false, error: error.message };
    }
  }