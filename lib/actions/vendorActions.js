'use server';
import dbConnect from '../db';
import Vendor from '@/models/Vendor';
import GroceryPurchase from '@/models/GroceryPurchase';

/**
 * Create a new vendor (SIMPLIFIED)
 */
/**
 * Make payment to vendor (distributes across unpaid orders)
 */
export async function makeVendorPayment(vendorName, paymentAmount, paymentMethod = 'CASH', note = '', paidBy = '') {
  try {
    await dbConnect();
    
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than 0' };
    }
    
    // Get all unpaid/partial orders for this vendor (oldest first)
    const unpaidOrders = await GroceryPurchase.find({
      vendorName: vendorName,
      paymentMethod: { $in: ['CREDIT', 'BANK_TRANSFER'] },
      remainingAmount: { $gt: 0 },
      isArchived: false
    })
    .sort({ createdAt: 1 }) // Oldest first (FIFO)
    .lean();
    
    if (unpaidOrders.length === 0) {
      return { success: false, error: 'No unpaid orders found for this vendor' };
    }
    
    const totalPending = unpaidOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
    
    if (amount > totalPending + 0.01) {
      return { 
        success: false, 
        error: `Payment amount (₨${amount}) exceeds total pending (₨${totalPending.toFixed(2)})` 
      };
    }
    
    let remainingPayment = amount;
    const updatedOrders = [];
    
    // Distribute payment across orders (FIFO - oldest first)
    for (const order of unpaidOrders) {
      if (remainingPayment <= 0) break;
      
      const orderRemaining = order.remainingAmount;
      const paymentForThisOrder = Math.min(remainingPayment, orderRemaining);
      
      // Update the order
      const groceryDoc = await GroceryPurchase.findById(order._id);
      
      groceryDoc.paymentHistory.push({
        amount: paymentForThisOrder,
        date: new Date(),
        method: paymentMethod,
        note: note || `Vendor payment: ${vendorName}`,
        paidBy: paidBy || 'Vendor Payment'
      });
      
      groceryDoc.paidAmount = (groceryDoc.paidAmount || 0) + paymentForThisOrder;
      groceryDoc.remainingAmount = Math.max(0, groceryDoc.totalAmount - groceryDoc.paidAmount);
      
      if (groceryDoc.remainingAmount <= 0.01) {
        groceryDoc.creditStatus = 'PAID';
        groceryDoc.remainingAmount = 0;
        if (groceryDoc.status === 'RECEIVED') {
          groceryDoc.status = 'COMPLETED';
        }
      } else {
        groceryDoc.creditStatus = 'PARTIAL';
      }
      
      groceryDoc.markModified('paidAmount');
      groceryDoc.markModified('remainingAmount');
      groceryDoc.markModified('creditStatus');
      groceryDoc.markModified('paymentHistory');
      
      await groceryDoc.save();
      
      updatedOrders.push({
        orderId: order._id,
        itemName: order.itemName,
        paidAmount: paymentForThisOrder,
        newRemaining: groceryDoc.remainingAmount
      });
      
      remainingPayment -= paymentForThisOrder;
    }
    
    // Sync vendor stats
    await syncVendorStats(vendorName);
    
    return {
      success: true,
      message: `Payment of ₨${amount.toFixed(2)} distributed across ${updatedOrders.length} order(s)`,
      data: {
        totalPaid: amount,
        ordersUpdated: updatedOrders.length,
        orders: updatedOrders
      }
    };
  } catch (error) {
    console.error('Make vendor payment error:', error);
    return { success: false, error: error.message };
  }
}
export async function createVendor(data) {
  try {
    await dbConnect();
    
    // Check if vendor already exists
    const existing = await Vendor.findOne({ 
      vendorName: { $regex: new RegExp(`^${data.vendorName}$`, 'i') }
    });
    
    if (existing) {
      return { success: false, error: 'Vendor with this name already exists' };
    }
    
    // Only save name and phone
    const vendor = await Vendor.create({
      vendorName: data.vendorName.trim(),
      phoneNumber: data.phoneNumber.trim()
    });
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendor.toObject())),
      message: 'Vendor created successfully'
    };
  } catch (error) {
    console.error('Create vendor error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update vendor (only name and phone)
 */
export async function updateVendor(id, data) {
  try {
    await dbConnect();
    
    const updateData = {
      vendorName: data.vendorName.trim(),
      phoneNumber: data.phoneNumber.trim()
    };
    
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendor.toObject())),
      message: 'Vendor updated successfully'
    };
  } catch (error) {
    console.error('Update vendor error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete vendor (only if no associated purchases)
 */
export async function deleteVendor(id) {
  try {
    await dbConnect();
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    // Check if vendor has any purchases
    const purchaseCount = await GroceryPurchase.countDocuments({
      vendorName: vendor.vendorName,
      isArchived: false
    });
    
    if (purchaseCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete vendor with ${purchaseCount} purchase(s). Archive the purchases first.` 
      };
    }
    
    await Vendor.findByIdAndDelete(id);
    
    return { 
      success: true, 
      message: 'Vendor deleted successfully'
    };
  } catch (error) {
    console.error('Delete vendor error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all vendors with stats
 */
export async function getAllVendors(filters = {}) {
  try {
    await dbConnect();
    
    const query = { ...filters };
    
    const vendors = await Vendor.find(query)
      .sort({ vendorName: 1 })
      .lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendors))
    };
  } catch (error) {
    console.error('Get all vendors error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Search vendors by name or phone
 */
export async function searchVendors(searchTerm) {
  try {
    await dbConnect();
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, data: [] };
    }
    
    const regex = new RegExp(searchTerm, 'i');
    
    const vendors = await Vendor.find({
      $or: [
        { vendorName: regex },
        { phoneNumber: regex }
      ],
      isActive: true
    })
    .limit(10)
    .lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendors))
    };
  } catch (error) {
    console.error('Search vendors error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get vendor by ID
 */
export async function getVendorById(id) {
  try {
    await dbConnect();
    
    const vendor = await Vendor.findById(id).lean();
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendor))
    };
  } catch (error) {
    console.error('Get vendor error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get vendor details with purchase history
 */
export async function getVendorDetails(vendorName) {
  try {
    await dbConnect();
    
    const vendor = await Vendor.findOne({ vendorName }).lean();
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    const purchases = await GroceryPurchase.find({ 
      vendorName: vendorName,
      isArchived: false
    })
    .sort({ createdAt: -1 })
    .lean();
    
    // Calculate real-time stats
    const stats = {
      totalOrders: purchases.length,
      totalPurchaseValue: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      totalPaid: purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalPending: purchases.reduce((sum, p) => sum + p.remainingAmount, 0),
      lastOrderDate: purchases.length > 0 ? purchases[0].createdAt : null
    };
    
    return { 
      success: true, 
      data: {
        vendor,
        purchases,
        stats
      }
    };
  } catch (error) {
    console.error('Get vendor details error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync vendor statistics from actual purchases
 */
export async function syncVendorStats(vendorName) {
  try {
    await dbConnect();
    
    const vendor = await Vendor.findOne({ vendorName });
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
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
    
    return { 
      success: true, 
      data: stats,
      message: 'Vendor stats synced successfully'
    };
  } catch (error) {
    console.error('Sync vendor stats error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get vendors with pending payments
 */
export async function getVendorsWithPendingPayments() {
  try {
    await dbConnect();
    
    const vendors = await Vendor.find({ 
      totalPending: { $gt: 0 },
      isActive: true
    })
    .sort({ totalPending: -1 })
    .lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(vendors))
    };
  } catch (error) {
    console.error('Get vendors with pending payments error:', error);
    return { success: false, error: error.message, data: [] };
  }
}