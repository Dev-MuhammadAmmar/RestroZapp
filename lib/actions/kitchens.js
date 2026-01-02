// lib/actions/kitchens.js
'use server';

import connectDB from '../db';
import Kitchen from '@/models/Kitchen';
import MenuItem from '@/models/MenuItem';
import { revalidatePath } from 'next/cache';

// Get all kitchens with populated menu items
export async function getKitchens() {
  try {
    await connectDB();
    const kitchens = await Kitchen.find()
      .populate({
        path: 'menuItems',
        populate: {
          path: 'categoryId',
          select: 'name icon color'
        }
      })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    
    return { success: true, data: JSON.parse(JSON.stringify(kitchens)) };
  } catch (error) {
    console.error('Error fetching kitchens:', error);
    return { error: 'Failed to fetch kitchens' };
  }
}

// Get single kitchen by ID
export async function getKitchenById(id) {
  try {
    await connectDB();
    const kitchen = await Kitchen.findById(id)
      .populate({
        path: 'menuItems',
        populate: {
          path: 'categoryId',
          select: 'name icon color'
        }
      })
      .lean();
    
    if (!kitchen) return { error: 'Kitchen not found' };
    
    return { success: true, data: JSON.parse(JSON.stringify(kitchen)) };
  } catch (error) {
    console.error('Error fetching kitchen:', error);
    return { error: 'Failed to fetch kitchen' };
  }
}

// Create new kitchen
export async function createKitchen(formData) {
  try {
    await connectDB();
    
    const existingKitchen = await Kitchen.findOne({ 
      name: { $regex: new RegExp(`^${formData.name}$`, 'i') } 
    });
    
    if (existingKitchen) {
      return { error: 'A kitchen with this name already exists' };
    }
    
    const kitchen = await Kitchen.create(formData);
    const populatedKitchen = await Kitchen.findById(kitchen._id)
      .populate({
        path: 'menuItems',
        populate: {
          path: 'categoryId',
          select: 'name icon color'
        }
      })
      .lean();
    
    revalidatePath('/kitchens');
    return { success: true, data: JSON.parse(JSON.stringify(populatedKitchen)) };
  } catch (error) {
    console.error('Error creating kitchen:', error);
    return { error: error.message || 'Failed to create kitchen' };
  }
}

// Update kitchen
export async function updateKitchen(id, formData) {
  try {
    await connectDB();
    
    if (formData.name) {
      const existingKitchen = await Kitchen.findOne({ 
        name: { $regex: new RegExp(`^${formData.name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingKitchen) {
        return { error: 'A kitchen with this name already exists' };
      }
    }
    
    const kitchen = await Kitchen.findByIdAndUpdate(
      id,
      formData,
      { new: true, runValidators: true }
    )
    .populate({
      path: 'menuItems',
      populate: {
        path: 'categoryId',
        select: 'name icon color'
      }
    })
    .lean();
    
    if (!kitchen) return { error: 'Kitchen not found' };
    
    revalidatePath('/kitchens');
    return { success: true, data: JSON.parse(JSON.stringify(kitchen)) };
  } catch (error) {
    console.error('Error updating kitchen:', error);
    return { error: error.message || 'Failed to update kitchen' };
  }
}

// Delete kitchen
export async function deleteKitchen(id) {
  try {
    await connectDB();
    
    // Remove kitchen reference from all menu items
    await MenuItem.updateMany(
      { kitchenId: id },
      { $set: { kitchenId: null } }
    );
    
    const kitchen = await Kitchen.findByIdAndDelete(id);
    
    if (!kitchen) return { error: 'Kitchen not found' };
    
    revalidatePath('/kitchens');
    revalidatePath('/inventory');
    return { success: true, message: 'Kitchen deleted successfully' };
  } catch (error) {
    console.error('Error deleting kitchen:', error);
    return { error: 'Failed to delete kitchen' };
  }
}

// Toggle kitchen status
export async function toggleKitchenStatus(id) {
  try {
    await connectDB();
    const kitchen = await Kitchen.findById(id);
    
    if (!kitchen) return { error: 'Kitchen not found' };
    
    kitchen.isActive = !kitchen.isActive;
    await kitchen.save();
    
    const populatedKitchen = await Kitchen.findById(id)
      .populate({
        path: 'menuItems',
        populate: {
          path: 'categoryId',
          select: 'name icon color'
        }
      })
      .lean();
    
    revalidatePath('/kitchens');
    return { success: true, data: JSON.parse(JSON.stringify(populatedKitchen)) };
  } catch (error) {
    console.error('Error toggling kitchen status:', error);
    return { error: 'Failed to toggle kitchen status' };
  }
}

// Add menu items to kitchen
export async function addItemsToKitchen(kitchenId, menuItemIds) {
  try {
    await connectDB();
    
    // Verify all menu items exist and are not already assigned to another kitchen
    const validItems = await MenuItem.find({ 
      _id: { $in: menuItemIds },
      $or: [
        { kitchenId: null },
        { kitchenId: kitchenId }
      ]
    });
    
    if (validItems.length !== menuItemIds.length) {
      return { error: 'Some items are already assigned to other kitchens or do not exist' };
    }
    
    const kitchen = await Kitchen.findById(kitchenId);
    if (!kitchen) return { error: 'Kitchen not found' };
    
    // Add only new items (avoid duplicates)
    const existingIds = kitchen.menuItems.map(id => id.toString());
    const newItemIds = menuItemIds.filter(id => !existingIds.includes(id.toString()));
    
    // Update kitchen
    kitchen.menuItems.push(...newItemIds);
    await kitchen.save();
    
    // Update menu items with kitchenId
    await MenuItem.updateMany(
      { _id: { $in: newItemIds } },
      { $set: { kitchenId: kitchenId } }
    );
    
    const populatedKitchen = await Kitchen.findById(kitchenId)
      .populate({
        path: 'menuItems',
        populate: {
          path: 'categoryId',
          select: 'name icon color'
        }
      })
      .lean();
    
    revalidatePath('/kitchens');
    revalidatePath('/inventory');
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(populatedKitchen)),
      message: `Added ${newItemIds.length} item(s) to kitchen`
    };
  } catch (error) {
    console.error('Error adding items to kitchen:', error);
    return { error: 'Failed to add items to kitchen' };
  }
}

// Remove menu items from kitchen
export async function removeItemsFromKitchen(kitchenId, menuItemIds) {
  try {
    await connectDB();
    
    const kitchen = await Kitchen.findById(kitchenId);
    if (!kitchen) return { error: 'Kitchen not found' };
    
    // Remove specified items from kitchen
    kitchen.menuItems = kitchen.menuItems.filter(
      id => !menuItemIds.includes(id.toString())
    );
    await kitchen.save();
    
    // Remove kitchen reference from menu items
    await MenuItem.updateMany(
      { _id: { $in: menuItemIds } },
      { $set: { kitchenId: null } }
    );
    
    const populatedKitchen = await Kitchen.findById(kitchenId)
      .populate({
        path: 'menuItems',
        populate: {
          path: 'categoryId',
          select: 'name icon color'
        }
      })
      .lean();
    
    revalidatePath('/kitchens');
    revalidatePath('/inventory');
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(populatedKitchen)),
      message: `Removed ${menuItemIds.length} item(s) from kitchen`
    };
  } catch (error) {
    console.error('Error removing items from kitchen:', error);
    return { error: 'Failed to remove items from kitchen' };
  }
}

// Bulk update kitchen display order
export async function updateKitchenOrder(kitchenOrders) {
  try {
    await connectDB();
    
    const bulkOps = kitchenOrders.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { displayOrder }
      }
    }));
    
    await Kitchen.bulkWrite(bulkOps);
    
    revalidatePath('/kitchens');
    return { success: true, message: 'Kitchen order updated successfully' };
  } catch (error) {
    console.error('Error updating kitchen order:', error);
    return { error: 'Failed to update kitchen order' };
  }
}