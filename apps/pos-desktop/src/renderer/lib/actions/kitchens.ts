export async function getKitchens() {
  const result = await window.restrozapp.inventory.getCatalog();
  if (!result.ok) return { success: false, error: result.error, data: [] };

  return {
    success: true,
    data: result.data.kitchens.map((kitchen) => ({
      _id: kitchen.id,
      name: kitchen.name,
      color: kitchen.color,
      isActive: kitchen.isActive,
      displayOrder: 0,
      menuItems: result.data.menuItems
        .filter((item) => item.kitchenId === kitchen.id)
        .map((item) => item.id),
    })),
  };
}

export async function createKitchen(formData: any) {
  const result = await window.restrozapp.inventory.createKitchen(formData);
  return result.ok ? { success: true, data: { _id: result.data.id, ...result.data } } : { success: false, error: result.error };
}

export async function updateKitchen(id: string, formData: any) {
  const result = await window.restrozapp.inventory.updateKitchen({ id, ...formData });
  return result.ok ? { success: true, data: { _id: result.data.id, ...result.data } } : { success: false, error: result.error };
}

export async function deleteKitchen(id: string) {
  const result = await window.restrozapp.inventory.deleteKitchen(id);
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

export async function toggleKitchenStatus(id: string) {
  const result = await window.restrozapp.inventory.toggleKitchen(id);
  return result.ok ? { success: true, data: { _id: result.data.id, ...result.data } } : { success: false, error: result.error };
}
