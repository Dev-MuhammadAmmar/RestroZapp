// lib/actions/categories.js
'use server';

import connectDB from '../db';
import Category from '@/models/Category';
import MenuItem from '@/models/MenuItem';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
  try {
    await connectDB();
    const categories = await Category.find({})
      .sort({ name: 1 })
      .lean();
    
    console.log('Categories Found:', categories.length);
    console.log('Categories:', categories);
    
    return { success: true, data: JSON.parse(JSON.stringify(categories)) };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { error: 'Failed to fetch categories' };
  }
}

export async function createCategory(formData) {
  try {
    await connectDB();
    const category = await Category.create(formData);
    revalidatePath('/inventory');
    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (error) {
    console.error('Error creating category:', error);
    return { error: error.message || 'Failed to create category' };
  }
}

export async function updateCategory(id, formData) {
  try {
    await connectDB();
    const category = await Category.findByIdAndUpdate(id, formData, { new: true, runValidators: true }).lean();
    if (!category) return { error: 'Category not found' };
    revalidatePath('/inventory');
    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (error) {
    console.error('Error updating category:', error);
    return { error: error.message || 'Failed to update category' };
  }
}

export async function deleteCategory(id) {
  try {
    await connectDB();
    const itemsCount = await MenuItem.countDocuments({ categoryId: id });
    if (itemsCount > 0) {
      return { error: `Cannot delete category. ${itemsCount} menu items are using it.` };
    }
    const category = await Category.findByIdAndDelete(id);
    if (!category) return { error: 'Category not found' };
    revalidatePath('/inventory');
    return { success: true, message: 'Category deleted successfully' };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: 'Failed to delete category' };
  }
}

// New function for bulk operations
export async function bulkUpdateCategories(categories) {
  try {
    await connectDB();
    
    for (const cat of categories) {
      if (cat._id && !cat.isNew) {
        // Update existing category
        await Category.findByIdAndUpdate(
          cat._id,
          { name: cat.name, icon: cat.icon, color: cat.color },
          { new: true, runValidators: true }
        );
      } else if (cat.isNew || !cat._id) {
        // Create new category
        await Category.create({ 
          name: cat.name, 
          icon: cat.icon, 
          color: cat.color 
        });
      }
    }

    revalidatePath('/inventory');
    return { success: true, message: 'Categories updated successfully' };
  } catch (error) {
    console.error('Error bulk updating categories:', error);
    return { error: 'Failed to update categories' };
  }
}