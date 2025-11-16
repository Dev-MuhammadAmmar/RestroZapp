// lib/actions/customers.js
'use server';

import connectDB from '../db';
import Customer from '@/models/Customer';

/**
 * Search customers by name or phone number with optimized query
 * @param {string} query - Search term (name or phone)
 * @returns {Object} - { success: true, data: customers[] } or { error: string }
 */
export async function searchCustomers(query) {
  try {
    await connectDB();
    
    // Validate input
    const trimmedQuery = query?.trim() || '';
    if (trimmedQuery.length < 2) {
      return { success: true, data: [] };
    }

    // Determine if query is phone number or name
    const isPhoneQuery = /^[0-9+\-\s()]+$/.test(trimmedQuery);
    
    let searchCondition;
    if (isPhoneQuery) {
      // Phone search - exact prefix match for better performance
      const cleanPhone = trimmedQuery.replace(/[\s\-()]/g, '');
      searchCondition = {
        phoneNumber: { $regex: `^${cleanPhone}`, $options: 'i' }
      };
    } else {
      // Name search - case-insensitive contains
      searchCondition = {
        name: { $regex: trimmedQuery, $options: 'i' }
      };
    }

    // Execute optimized query with lean() for better performance
    const customers = await Customer.find(searchCondition)
      .select('name phoneNumber address orderCount lastOrderDate totalSpent')
      .sort({ orderCount: -1, lastOrderDate: -1 }) // Prioritize frequent customers
      .limit(5) // Only show top 5 matches
      .lean(); // Use lean() for faster queries

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
 * Create new customer or update existing one
 * @param {Object} customerData - { name, phoneNumber, address }
 * @returns {Object} - { success: true, data: customer } or { error: string }
 */
export async function createOrUpdateCustomer(customerData) {
  try {
    await connectDB();

    const { name, phoneNumber, address } = customerData;

    // Validate required fields
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return { error: 'Phone number is required' };
    }

    const cleanPhone = phoneNumber.trim();
    const cleanName = name?.trim() || 'Guest';

    // Use upsert for atomic operation
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
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
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
 * @param {string} phoneNumber 
 * @param {number} amount 
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
 * @param {string} phoneNumber 
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
      .select('name phoneNumber address orderCount lastOrderDate totalSpent')
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
 * @param {number} limit 
 */
export async function getTopCustomers(limit = 10) {
  try {
    await connectDB();

    const customers = await Customer.find()
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