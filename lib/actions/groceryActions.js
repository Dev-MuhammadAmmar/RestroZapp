// lib/actions/groceryActions.js
'use server';
import dbConnect from '../db';
import GroceryPurchase from '@/models/GroceryPurchase';

/**
 * Create a new grocery purchase
 */
export async function createGroceryPurchase(data) {
  try {
    await dbConnect();
    
    const creditStatus = data.paymentMethod === 'CREDIT' ? 
      (data.remainingAmount > 0 ? 'UNPAID' : 'PAID') : 'N/A';
    
    const grocery = await GroceryPurchase.create({
      ...data,
      creditStatus,
      orderDate: new Date()
    });
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(grocery.toObject()))
    };
  } catch (error) {
    console.error('Create grocery error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing grocery purchase
 */
export async function updateGroceryPurchase(id, data) {
  try {
    await dbConnect();
    
    const updateData = { ...data };
    
    // Set completion date if marking as completed
    if (data.status === 'COMPLETED' && !data.completedDate) {
      updateData.completedDate = new Date();
    }
    
    // Recalculate credit fields if needed
    if (data.paymentMethod === 'CREDIT') {
      updateData.creditStatus = updateData.remainingAmount <= 0 ? 'PAID' : 'UNPAID';
    } else {
      updateData.creditStatus = 'N/A';
    }
    
    const grocery = await GroceryPurchase.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!grocery) {
      return { success: false, error: 'Grocery not found' };
    }
    
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
 * Mark credit payment
 */
export async function markCreditPaid(id, paidAmount) {
  try {
    await dbConnect();
    
    const grocery = await GroceryPurchase.findById(id);
    if (!grocery) {
      return { success: false, error: 'Grocery not found' };
    }
    
    if (grocery.paymentMethod !== 'CREDIT') {
      return { success: false, error: 'This is not a credit purchase' };
    }
    
    const newPaidAmount = (grocery.paidAmount || 0) + paidAmount;
    const remainingAmount = grocery.totalAmount - newPaidAmount;
    
    const updated = await GroceryPurchase.findByIdAndUpdate(
      id,
      {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, remainingAmount),
        creditStatus: remainingAmount <= 0 ? 'PAID' : 'UNPAID',
        lastPaymentDate: new Date()
      },
      { new: true, runValidators: true }
    );
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(updated.toObject()))
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
      return { success: false, error: 'Grocery not found' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Delete grocery error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all groceries with sorting
 */
export async function getAllGroceries() {
  try {
    await dbConnect();
    
    const groceries = await GroceryPurchase.find()
      .sort({ createdAt: -1 })
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
 * Get unpaid credits summary
 */
export async function getUnpaidCredits() {
  try {
    await dbConnect();
    
    const unpaid = await GroceryPurchase.find({ 
      paymentMethod: 'CREDIT', 
      creditStatus: 'UNPAID' 
    }).lean();
    
    const total = unpaid.reduce((sum, g) => sum + (g.remainingAmount || 0), 0);
    
    return { 
      success: true, 
      total: parseFloat(total.toFixed(2)), 
      count: unpaid.length 
    };
  } catch (error) {
    console.error('Get unpaid credits error:', error);
    return { success: false, error: error.message, total: 0, count: 0 };
  }
}

/**
 * Get grocery statistics
 */
export async function getGroceryStats() {
  try {
    await dbConnect();
    
    const allGroceries = await GroceryPurchase.find().lean();
    
    const stats = {
      totalPurchases: allGroceries.length,
      totalSpent: allGroceries.reduce((sum, g) => sum + g.totalAmount, 0),
      pendingOrders: allGroceries.filter(g => g.status === 'PENDING').length,
      completedOrders: allGroceries.filter(g => g.status === 'COMPLETED').length,
      avgOrderValue: allGroceries.length > 0 
        ? allGroceries.reduce((sum, g) => sum + g.totalAmount, 0) / allGroceries.length 
        : 0,
      totalCashPurchases: allGroceries.filter(g => g.paymentMethod === 'CASH').length,
      totalCreditPurchases: allGroceries.filter(g => g.paymentMethod === 'CREDIT').length,
      thisMonthSpent: allGroceries
        .filter(g => {
          const date = new Date(g.createdAt);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, g) => sum + g.totalAmount, 0),
      thisWeekSpent: allGroceries
        .filter(g => {
          const date = new Date(g.createdAt);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        })
        .reduce((sum, g) => sum + g.totalAmount, 0)
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Get stats error:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Get unique vendors list
 */
export async function getVendorsList() {
  try {
    await dbConnect();
    
    const vendors = await GroceryPurchase.distinct('vendorName');
    
    return { 
      success: true, 
      data: vendors.sort()
    };
  } catch (error) {
    console.error('Get vendors error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Export grocery data (can be extended for CSV/Excel export)
 */
export async function exportGroceryData(groceries) {
  try {
    // This is a placeholder - implement actual export logic
    // You can use libraries like 'csv-writer' or 'xlsx' for file generation
    
    const csvData = groceries.map(g => ({
      Date: new Date(g.createdAt).toLocaleDateString(),
      Item: g.itemName,
      Quantity: `${g.quantity} ${g.unit}`,
      Vendor: g.vendorName,
      OrderedBy: g.orderedBy,
      Amount: g.totalAmount,
      Payment: g.paymentMethod,
      Status: g.status
    }));
    
    return { 
      success: true, 
      data: csvData,
      message: 'Export data prepared successfully'
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get vendor-wise spending analysis
 */
export async function getVendorAnalysis() {
  try {
    await dbConnect();
    
    const vendorStats = await GroceryPurchase.aggregate([
      {
        $group: {
          _id: '$vendorName',
          totalSpent: { $sum: '$totalAmount' },
          totalPurchases: { $sum: 1 },
          avgPurchaseValue: { $avg: '$totalAmount' },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMethod', 'CREDIT'] },
                '$remainingAmount',
                0
              ]
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendorStats))
    };
  } catch (error) {
    console.error('Get vendor analysis error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get category-wise spending
 */
export async function getCategoryAnalysis() {
  try {
    await dbConnect();
    
    const categoryStats = await GroceryPurchase.aggregate([
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$totalAmount' },
          totalItems: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(categoryStats))
    };
  } catch (error) {
    console.error('Get category analysis error:', error);
    return { success: false, error: error.message, data: [] };
  }
}