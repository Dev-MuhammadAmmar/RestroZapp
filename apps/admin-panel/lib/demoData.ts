export const demoRestaurants = [
  {
    id: "demo-restaurant-1",
    restaurant_code: "SRP-001",
    name: "RestroZapp",
    status: "active",
    plan: "standard",
    phone1: "",
    backup_enabled: true,
    created_at: new Date().toISOString(),
  },
];

export const demoDevices = [
  {
    id: "device-1",
    restaurant_code: "SRP-001",
    computer_name: "Counter Laptop",
    status: "pending",
    app_version: "0.1.0",
    last_seen_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "device-2",
    restaurant_code: "SRP-001",
    computer_name: "Owner PC",
    status: "approved",
    app_version: "0.1.0",
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const demoBackups = [
  {
    id: "backup-1",
    restaurant_code: "SRP-001",
    type: "daily",
    status: "uploaded",
    file_name: "daily-demo.zip",
    size_bytes: 204800,
    created_at: new Date().toISOString(),
  },
];

export const demoVersions = [
  {
    id: "version-1",
    version: "0.1.0",
    required: false,
    notes: "Foundation release",
    created_at: new Date().toISOString(),
  },
];
