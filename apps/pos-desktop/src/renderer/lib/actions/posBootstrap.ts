import { toPosMenuItem } from "./menuItems";
import { toPosOrder } from "./orders";

export async function loadPosBootstrap() {
  const result = await window.restrozapp.pos.bootstrap();
  if (!result.ok) return { success: false as const, error: result.error };
  const categories = result.data.catalog.categories.map((category) => ({
    _id: category.id,
    name: category.name,
    color: category.color,
    isActive: category.isActive,
  }));
  const kitchens = result.data.catalog.kitchens.map((kitchen) => ({
    _id: kitchen.id,
    name: kitchen.name,
    color: kitchen.color,
    isActive: kitchen.isActive,
    displayOrder: 0,
  }));
  return {
    success: true as const,
    data: {
      categories,
      kitchens,
      menuItems: result.data.catalog.menuItems.map((item) => toPosMenuItem(item, categories, kitchens)),
      settings: result.data.settings,
      pendingOrders: result.data.pendingOrders.map(toPosOrder),
    },
  };
}
