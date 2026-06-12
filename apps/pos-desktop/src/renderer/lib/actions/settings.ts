type SettingsPage = {
  _id: string;
  restaurantName: string;
  restaurantLogo: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  taxPercentage: number;
  deliveryCharges: number;
  footerMessage: string;
  printCustomerTicket: boolean;
  splitKOTByKitchen: boolean;
  createdAt: string;
  updatedAt: string;
};

const fallbackSettings: SettingsPage = {
  _id: "local-settings",
  restaurantName: "RestroZapp",
  restaurantLogo: "",
  address: "",
  phone1: "",
  phone2: "",
  email: "admin@restaurant.com",
  taxPercentage: 0,
  deliveryCharges: 0,
  footerMessage: "Thank You for Dining with Us!",
  printCustomerTicket: true,
  splitKOTByKitchen: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getSettings() {
  const local = await window.restrozapp.pos.getSettings();
  return {
    success: true,
    data: {
      ...fallbackSettings,
      ...(local.ok ? local.data : {}),
    },
  };
}

export async function verifyPassword(inputPassword: string) {
  const result = await window.restrozapp.pos.verifyPassword(inputPassword);
  return result.ok
    ? { success: Boolean(result.data?.valid), error: result.data?.valid ? undefined : "Incorrect password" }
    : { success: false, error: result.error };
}

export async function updateSettings(password: string, updates: Partial<SettingsPage>) {
  const result = await window.restrozapp.pos.updateSettings({ password, values: updates });
  if (!result.ok) return { success: false, error: result.error };
  const fresh = await getSettings();
  return {
    success: true,
    data: { ...fresh.data, updatedAt: new Date().toISOString() },
    message: "Settings updated successfully",
  };
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const result = await window.restrozapp.pos.changePassword({ currentPassword: oldPassword, newPassword });
  return result.ok
    ? { success: true, message: "Password changed successfully" }
    : { success: false, error: result.error };
}

export async function togglePrintCustomerTicket(enable: boolean) {
  const result = await window.restrozapp.pos.setSetting({ key: "printCustomerTicket", value: enable });
  if (!result.ok) return { success: false, error: result.error };
  return {
    success: true,
    message: `Print customer ticket ${enable ? "enabled" : "disabled"} successfully`,
    data: { printCustomerTicket: enable },
  };
}

export async function toggleSplitKOTByKitchen(enable: boolean) {
  const result = await window.restrozapp.pos.setSetting({ key: "splitKOTByKitchen", value: enable });
  if (!result.ok) return { success: false, error: result.error };
  return {
    success: true,
    message: `Split KOT by kitchen ${enable ? "enabled" : "disabled"} successfully`,
    data: { splitKOTByKitchen: enable },
  };
}
