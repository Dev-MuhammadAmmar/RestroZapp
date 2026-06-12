export async function searchCustomers(query: string) {
  const result = await window.restrozapp.pos.searchCustomers(query);
  if (!result.ok) return { success: false, error: result.error, data: [] };
  return {
    success: true,
    data: result.data.map((customer) => ({
      _id: customer.id,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      email: customer.email,
      notes: customer.notes,
      orderCount: customer.orderCount,
      totalSpent: customer.totalSpent,
      lastOrderDate: customer.lastOrderDate,
      isActive: true,
    })),
  };
}

export async function getAllCustomers() {
  const result = await window.restrozapp.customers.list();
  if (!result.ok) return { success: false, error: result.error, data: [] };
  return { success: true, data: result.data.map(toPosCustomer), total: result.data.length };
}

function toPosCustomer(customer: any) {
  return { _id: customer.id, ...customer, isActive: true };
}

export async function createCustomer(customerData: any) {
  const result = await window.restrozapp.customers.create(customerData);
  return result.ok ? { success: true, data: toPosCustomer(result.data) } : { success: false, error: result.error };
}

export async function updateCustomer(id: string, customerData: any) {
  const result = await window.restrozapp.customers.update({ id, ...customerData });
  return result.ok ? { success: true, data: toPosCustomer(result.data) } : { success: false, error: result.error };
}

export async function deleteCustomer(id: string) {
  const result = await window.restrozapp.customers.delete(id);
  return result.ok ? { success: true } : { success: false, error: result.error };
}

export async function getCustomerStats() {
  const result = await window.restrozapp.customers.list();
  if (!result.ok) return { success: false, error: result.error };
  const customers = result.data;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  return {
    success: true,
    data: {
      totalCustomers: customers.length,
      totalRevenue,
      averageOrdersPerCustomer: customers.length
        ? customers.reduce((sum, customer) => sum + customer.orderCount, 0) / customers.length
        : 0,
      averageSpendPerCustomer: customers.length ? totalRevenue / customers.length : 0,
    },
  };
}

export async function getTopCustomers(limit = 10) {
  const result = await window.restrozapp.customers.list();
  if (!result.ok) return { success: false, error: result.error, data: [] };
  return {
    success: true,
    data: result.data
      .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map(toPosCustomer),
  };
}
