export async function getCategories() {
  const result = await window.restrozapp.inventory.getCatalog();
  if (!result.ok) return { success: false, error: result.error, data: [] };

  return {
    success: true,
    data: result.data.categories.map((category) => ({
      _id: category.id,
      name: category.name,
      color: category.color,
      isActive: category.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  };
}

export async function createCategory(formData: any) {
  const result = await window.restrozapp.inventory.bulkCategories([{ ...formData, isNew: true }]);
  if (!result.ok) return { success: false, error: result.error };
  return getCategories();
}

export async function updateCategory(id: string, formData: any) {
  const result = await window.restrozapp.inventory.bulkCategories([{ _id: id, ...formData }]);
  if (!result.ok) return { success: false, error: result.error };
  return getCategories();
}

export async function deleteCategory(id: string) {
  const result = await window.restrozapp.inventory.deleteCategory(id);
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

export async function bulkUpdateCategories(categories: any[]) {
  const result = await window.restrozapp.inventory.bulkCategories(categories);
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data };
}
