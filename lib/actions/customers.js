// lib/actions/customers.js
'use server';

import connectDB from '../db';
import Customer from '@/models/Customer';

/**
 * Search customers by name or phone number with optimized query
 */
export async function searchCustomers(query) {
  try {
    await connectDB();
    
    const trimmedQuery = query?.trim() || '';
    if (trimmedQuery.length < 2) {
      return { success: true, data: [] };
    }

    const isPhoneQuery = /^[0-9+\-\s()]+$/.test(trimmedQuery);
    
    let searchCondition;
    if (isPhoneQuery) {
      const cleanPhone = trimmedQuery.replace(/[\s\-()]/g, '');
      searchCondition = {
        phoneNumber: { $regex: `^${cleanPhone}`, $options: 'i' }
      };
    } else {
      searchCondition = {
        name: { $regex: trimmedQuery, $options: 'i' }
      };
    }

    const customers = await Customer.find(searchCondition)
      .select('name phoneNumber address email orderCount lastOrderDate totalSpent notes isActive')
      .sort({ orderCount: -1, lastOrderDate: -1 })
      .limit(20)
      .lean();

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customers)) 
    };
  } catch (error) {
    console.error('❌ Error searching customers:', error);
    return { 
      success: false, 
      error: 'Failed to search customers',
      data: [] 
    };
  }
}

/**
 * Get all customers with pagination
 */
export async function getAllCustomers(page = 1, limit = 50) {
  try {
    await connectDB();
    
    const skip = (page - 1) * limit;
    
    const [customers, total] = await Promise.all([
      Customer.find({ isActive: true })
        .select('name phoneNumber address email orderCount lastOrderDate totalSpent notes')
        .sort({ lastOrderDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments({ isActive: true })
    ]);

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customers)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    return { 
      success: false, 
      error: 'Failed to fetch customers',
      data: [],
      total: 0
    };
  }
}

/**
 * Create new customer
 */
export async function createCustomer(customerData) {
  try {
    await connectDB();

    const { name, phoneNumber, address, email, notes } = customerData;

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return { error: 'Phone number is required' };
    }

    if (!name || name.trim().length === 0) {
      return { error: 'Customer name is required' };
    }

    // Check if phone number already exists
    const existing = await Customer.findOne({ 
      phoneNumber: phoneNumber.trim() 
    }).lean();

    if (existing) {
      return { error: 'Customer with this phone number already exists' };
    }

    const customer = await Customer.create({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address?.trim() || '',
      email: email?.trim() || '',
      notes: notes?.trim() || '',
      orderCount: 0,
      totalSpent: 0,
      lastOrderDate: new Date(),
    });

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customer)) 
    };
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    return { 
      error: error.message || 'Failed to create customer' 
    };
  }
}

/**
 * Update existing customer
 */
export async function updateCustomer(customerId, customerData) {
  try {
    await connectDB();

    if (!customerId) {
      return { error: 'Customer ID is required' };
    }

    const { name, phoneNumber, address, email, notes } = customerData;

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return { error: 'Phone number is required' };
    }

    if (!name || name.trim().length === 0) {
      return { error: 'Customer name is required' };
    }

    // Check if phone number is being changed to one that already exists
    const existing = await Customer.findOne({ 
      phoneNumber: phoneNumber.trim(),
      _id: { $ne: customerId }
    }).lean();

    if (existing) {
      return { error: 'Another customer with this phone number already exists' };
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address?.trim() || '',
        email: email?.trim() || '',
        notes: notes?.trim() || '',
      },
      { new: true, runValidators: true }
    ).lean();

    if (!customer) {
      return { error: 'Customer not found' };
    }

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customer)) 
    };
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    return { 
      error: error.message || 'Failed to update customer' 
    };
  }
}

/**
 * Delete customer (soft delete)
 */
export async function deleteCustomer(customerId) {
  try {
    await connectDB();

    if (!customerId) {
      return { error: 'Customer ID is required' };
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { isActive: false },
      { new: true }
    ).lean();

    if (!customer) {
      return { error: 'Customer not found' };
    }

    return { 
      success: true, 
      message: 'Customer deleted successfully' 
    };
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    return { 
      error: 'Failed to delete customer' 
    };
  }
}

/**
 * Create or update customer (for orders)
 */
export async function createOrUpdateCustomer(customerData) {
  try {
    await connectDB();

    const { name, phoneNumber, address } = customerData;

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return { error: 'Phone number is required' };
    }

    const cleanPhone = phoneNumber.trim();
    const cleanName = name?.trim() || 'Guest';

    const customer = await Customer.findOneAndUpdate(
      { phoneNumber: cleanPhone },
      {
        $set: {
          name: cleanName,
          address: address?.trim() || '',
          lastOrderDate: new Date(),
        },
        $inc: { orderCount: 1 },
        $setOnInsert: {
          createdAt: new Date(),
          totalSpent: 0,
        }
      },
      {
        upsert: true,
        new: true,
        lean: true,
      }
    );

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customer)) 
    };
  } catch (error) {
    console.error('❌ Error creating/updating customer:', error);
    return { 
      error: 'Failed to save customer data' 
    };
  }
}

/**
 * Update customer's total spending
 */
export async function updateCustomerSpending(phoneNumber, amount) {
  try {
    await connectDB();
    
    if (!phoneNumber || amount <= 0) return { success: true };

    await Customer.findOneAndUpdate(
      { phoneNumber: phoneNumber.trim() },
      { $inc: { totalSpent: amount } },
      { lean: true }
    );
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating customer spending:', error);
    return { error: 'Failed to update customer spending' };
  }
}

/**
 * Get customer by phone number
 */
export async function getCustomerByPhone(phoneNumber) {
  try {
    await connectDB();
    
    if (!phoneNumber) {
      return { error: 'Phone number is required' };
    }

    const customer = await Customer.findOne({ 
      phoneNumber: phoneNumber.trim() 
    })
      .select('name phoneNumber address email orderCount lastOrderDate totalSpent notes')
      .lean();

    if (!customer) {
      return { error: 'Customer not found' };
    }

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customer)) 
    };
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    return { error: 'Failed to fetch customer' };
  }
}

/**
 * Get top customers by order count
 */
export async function getTopCustomers(limit = 10) {
  try {
    await connectDB();

    const customers = await Customer.find({ isActive: true })
      .select('name phoneNumber address orderCount lastOrderDate totalSpent')
      .sort({ orderCount: -1, totalSpent: -1 })
      .limit(limit)
      .lean();

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(customers)) 
    };
  } catch (error) {
    console.error('❌ Error fetching top customers:', error);
    return { error: 'Failed to fetch top customers' };
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats() {
  try {
    await connectDB();

    const stats = await Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          averageOrdersPerCustomer: { $avg: '$orderCount' },
          averageSpendPerCustomer: { $avg: '$totalSpent' },
        }
      }
    ]);

    const result = stats[0] || {
      totalCustomers: 0,
      totalRevenue: 0,
      averageOrdersPerCustomer: 0,
      averageSpendPerCustomer: 0,
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(result))
    };
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    return { 
      error: 'Failed to fetch statistics',
      data: {
        totalCustomers: 0,
        totalRevenue: 0,
        averageOrdersPerCustomer: 0,
        averageSpendPerCustomer: 0,
      }
    };
  }
}