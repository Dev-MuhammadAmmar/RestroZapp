// lib/actions/menuItems.js
'use server';

import connectDB from '../db';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';
import Kitchen from '@/models/Kitchen';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

// Get ACTIVE menu items sorted by popularity (for POS)
export async function getActiveMenuItems() {
  try {
    await connectDB();
    
    const menuItems = await MenuItem.find({ isActive: true })
      .populate('categoryId', 'name icon color')
      .populate('kitchenId', 'name icon color') // Populate kitchen info
      .lean();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orders = await Order.find({ 
      status: { $in: ['completed', 'ready'] },
      orderDate: { $gte: thirtyDaysAgo }
    })
    .select('items')
    .lean();
    
    const itemSalesMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItemId?.toString();
        if (itemId) {
          itemSalesMap[itemId] = (itemSalesMap[itemId] || 0) + item.quantity;
        }
      });
    });
    
    const menuItemsWithSales = menuItems.map(item => ({
      ...item,
      salesCount: itemSalesMap[item._id.toString()] || 0
    }));
    
    menuItemsWithSales.sort((a, b) => {
      if (b.salesCount !== a.salesCount) {
        return b.salesCount - a.salesCount;
      }
      return a.name.localeCompare(b.name);
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
      .populate('kitchenId', 'name icon color') // Populate kitchen info
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
    
    // Validate kitchen if provided
    if (formData.kitchenId) {
      const kitchen = await Kitchen.findById(formData.kitchenId);
      if (!kitchen) return { error: 'Kitchen not found' };
    }
    
    const menuItem = await MenuItem.create(formData);
    
    // If kitchen is assigned, add to kitchen's menuItems array
    if (formData.kitchenId) {
      await Kitchen.findByIdAndUpdate(
        formData.kitchenId,
        { $addToSet: { menuItems: menuItem._id } }
      );
    }
    
    const populatedItem = await MenuItem.findById(menuItem._id)
      .populate('categoryId', 'name icon color')
      .populate('kitchenId', 'name icon color')
      .lean();
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    revalidatePath('/kitchens');
    return { success: true, data: JSON.parse(JSON.stringify(populatedItem)) };
  } catch (error) {
    console.error('Error creating menu item:', error);
    return { error: error.message || 'Failed to create menu item' };
  }
}

export async function updateMenuItem(id, formData) {
  try {
    await connectDB();
    
    const existingItem = await MenuItem.findById(id);
    if (!existingItem) return { error: 'Menu item not found' };
    
    if (formData.categoryId) {
      const category = await Category.findById(formData.categoryId);
      if (!category) return { error: 'Category not found' };
    }
    
    // Handle kitchen change
    const oldKitchenId = existingItem.kitchenId?.toString();
    const newKitchenId = formData.kitchenId?.toString();
    
    if (oldKitchenId !== newKitchenId) {
      // Remove from old kitchen
      if (oldKitchenId) {
        await Kitchen.findByIdAndUpdate(
          oldKitchenId,
          { $pull: { menuItems: id } }
        );
      }
      
      // Add to new kitchen
      if (newKitchenId) {
        const kitchen = await Kitchen.findById(newKitchenId);
        if (!kitchen) return { error: 'Kitchen not found' };
        
        await Kitchen.findByIdAndUpdate(
          newKitchenId,
          { $addToSet: { menuItems: id } }
        );
      }
    }
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      id, 
      formData, 
      { new: true, runValidators: true }
    )
    .populate('categoryId', 'name icon color')
    .populate('kitchenId', 'name icon color')
    .lean();
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    revalidatePath('/kitchens');
    return { success: true, data: JSON.parse(JSON.stringify(menuItem)) };
  } catch (error) {
    console.error('Error updating menu item:', error);
    return { error: error.message || 'Failed to update menu item' };
  }
}

export async function deleteMenuItem(id) {
  try {
    await connectDB();
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) return { error: 'Menu item not found' };
    
    // Remove from kitchen if assigned
    if (menuItem.kitchenId) {
      await Kitchen.findByIdAndUpdate(
        menuItem.kitchenId,
        { $pull: { menuItems: id } }
      );
    }
    
    await MenuItem.findByIdAndDelete(id);
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    revalidatePath('/kitchens');
    return { success: true, message: 'Menu item deleted successfully' };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { error: 'Failed to delete menu item' };
  }
}

export async function toggleMenuItemPin(menuItemId) {
  try {
    const menuItem = await MenuItem.findById(menuItemId);
    
    if (!menuItem) {
      return { success: false, error: 'Menu item not found' };
    }

    menuItem.isPinned = !menuItem.isPinned;
    menuItem.pinnedAt = menuItem.isPinned ? new Date() : null;
    
    await menuItem.save();

    return { 
      success: true, 
      data: {
        _id: menuItem._id,
        isPinned: menuItem.isPinned
      }
    };
  } catch (error) {
    console.error('Error toggling pin:', error);
    return { success: false, error: error.message };
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
      .populate('kitchenId', 'name icon color')
      .lean();
    
    revalidatePath('/inventory');
    revalidatePath('/pos');
    return { success: true, data: JSON.parse(JSON.stringify(populatedItem)) };
  } catch (error) {
    console.error('Error toggling menu item status:', error);
    return { error: 'Failed to toggle menu item status' };
  }
}