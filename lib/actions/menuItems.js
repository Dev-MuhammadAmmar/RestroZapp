// lib/actions/menuItems.js
'use server';

import connectDB from '../db';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

// Get ACTIVE menu items sorted by popularity (for POS)
export async function getActiveMenuItems() {
  try {
    await connectDB();
    
    // Get all active menu items
    const menuItems = await MenuItem.find({ isActive: true })
      .populate('categoryId', 'name icon color')
      .lean();
    
    // Get item popularity from completed orders (last 30 days for performance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orders = await Order.find({ 
      status: { $in: ['completed', 'ready'] },
      orderDate: { $gte: thirtyDaysAgo }
    })
    .select('items')
    .lean();
    
    // Calculate item sales count
    const itemSalesMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItemId?.toString();
        if (itemId) {
          itemSalesMap[itemId] = (itemSalesMap[itemId] || 0) + item.quantity;
        }
      });
    });
    
    // Add salesCount to menu items and sort
    const menuItemsWithSales = menuItems.map(item => ({
      ...item,
      salesCount: itemSalesMap[item._id.toString()] || 0
    }));
    
    // Sort: highest sales first, then alphabetically for items with same sales
    menuItemsWithSales.sort((a, b) => {
      if (b.salesCount !== a.salesCount) {
        return b.salesCount - a.salesCount; // Descending by sales
      }
      return a.name.localeCompare(b.name); // Alphabetically if sales are equal
    });
    
    return { success: true, data: JSON.parse(JSON.stringify(menuItemsWithSales)) };
  } catch (error) {
    console.error('Error fetching active menu items:', error);
    return { error: 'Failed to fetch active menu items' };
  }
}

// Get ALL menu items (for inventory management)
export async function getMenuItems() {
  try {
    await connectDB();
    const menuItems = await MenuItem.find()
      .populate('categoryId', 'name icon color')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(menuItems)) };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return { error: 'Failed to fetch menu items' };
  }
}

export async function createMenuItem(formData) {
  try {
    await connectDB();
    const category = await Category.findById(formData.categoryId);
    if (!category) return { error: 'Category not found' };
    
    const menuItem = await MenuItem.create(formData);
    const populatedItem = await MenuItem.findById(menuItem._id)
      .populate('categoryId', 'name icon color')
      .lean();
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    return { success: true, data: JSON.parse(JSON.stringify(populatedItem)) };
  } catch (error) {
    console.error('Error creating menu item:', error);
    return { error: error.message || 'Failed to create menu item' };
  }
}

export async function updateMenuItem(id, formData) {
  try {
    await connectDB();
    if (formData.categoryId) {
      const category = await Category.findById(formData.categoryId);
      if (!category) return { error: 'Category not found' };
    }
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      id, 
      formData, 
      { new: true, runValidators: true }
    )
    .populate('categoryId', 'name icon color')
    .lean();
    
    if (!menuItem) return { error: 'Menu item not found' };
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    return { success: true, data: JSON.parse(JSON.stringify(menuItem)) };
  } catch (error) {
    console.error('Error updating menu item:', error);
    return { error: error.message || 'Failed to update menu item' };
  }
}

export async function deleteMenuItem(id) {
  try {
    await connectDB();
    const menuItem = await MenuItem.findByIdAndDelete(id);
    if (!menuItem) return { error: 'Menu item not found' };
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    return { success: true, message: 'Menu item deleted successfully' };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { error: 'Failed to delete menu item' };
  }
}

export async function toggleMenuItemStatus(id) {
  try {
    await connectDB();
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) return { error: 'Menu item not found' };
    
    menuItem.isActive = !menuItem.isActive;
    await menuItem.save();
    
    const populatedItem = await MenuItem.findById(id)
      .populate('categoryId', 'name icon color')
      .lean();
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    return { success: true, data: JSON.parse(JSON.stringify(populatedItem)) };
  } catch (error) {
    console.error('Error toggling menu item status:', error);
    return { error: 'Failed to toggle menu item status' };
  }
}