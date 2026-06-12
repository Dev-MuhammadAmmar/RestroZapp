import type { PosMenuItem } from "@restrozapp/shared";

export function toPosMenuItem(item: PosMenuItem, categories: any[], kitchens: any[]) {
  const category = categories.find((entry) => entry._id === item.categoryId) || null;
  const kitchen = kitchens.find((entry) => entry._id === item.kitchenId) || null;
  return {
    _id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    description: item.description,
    categoryId: category,
    kitchenId: kitchen,
    sellingPrice: item.sellingPrice,
    preparationTime: item.preparationTime,
    isPinned: item.isPinned,
    pinnedAt: item.isPinned ? new Date().toISOString() : null,
    isActive: item.isActive,
    salesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function catalog(includeInactive = false) {
  return includeInactive ? window.restrozapp.inventory.getCatalog() : window.restrozapp.pos.getCatalog();
}

async function mapMenuItems(includeInactive = false) {
  const result = await catalog(includeInactive);
  if (!result.ok) return { success: false, error: result.error, data: [] };

  const categories = result.data.categories.map((category) => ({
    _id: category.id,
    name: category.name,
    color: category.color,
    isActive: category.isActive,
  }));
  const kitchens = result.data.kitchens.map((kitchen) => ({
    _id: kitchen.id,
    name: kitchen.name,
    color: kitchen.color,
    isActive: true,
  }));

  const mapped = result.data.menuItems.map((item) => toPosMenuItem(item, categories, kitchens));
  return {
    success: true,
    data: includeInactive ? mapped : mapped.filter((item) => item.isActive),
  };
}

export async function getActiveMenuItems() {
  return mapMenuItems(false);
}

export async function getMenuItems() {
  return mapMenuItems(true);
}

export async function createMenuItem(formData: any) {
  const result = await window.restrozapp.inventory.createMenuItem(formData);
  if (!result.ok) return { success: false, error: result.error };
  const mapped = await mapMenuItems(true);
  return {
    success: true,
    data: mapped.data.find((item: any) => item._id === result.data.id),
  };
}

export async function updateMenuItem(id: string, formData: any) {
  const result = await window.restrozapp.inventory.updateMenuItem({ id, ...formData });
  if (!result.ok) return { success: false, error: result.error };
  const mapped = await mapMenuItems(true);
  return {
    success: true,
    data: mapped.data.find((item: any) => item._id === result.data.id),
  };
}

export async function deleteMenuItem(id: string) {
  const result = await window.restrozapp.inventory.deleteMenuItem(id);
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

export async function toggleMenuItemPin(menuItemId: string) {
  const result = await window.restrozapp.pos.toggleMenuItemPin(menuItemId);
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data };
}

export async function toggleMenuItemStatus(id: string) {
  const result = await window.restrozapp.inventory.toggleMenuItem(id);
  if (!result.ok) return { success: false, error: result.error };
  const mapped = await mapMenuItems(true);
  return {
    success: true,
    data: mapped.data.find((item: any) => item._id === result.data.id),
  };
}
