import { contextBridge, ipcRenderer } from "electron";

type BackupType = "manual" | "daily" | "weekly" | "monthly" | "emergency";

const IPC_CHANNELS = {
  activationGetState: "activation:get-state",
  activationRequest: "activation:request",
  activationRefresh: "activation:refresh",
  systemStatus: "system:status",
  backupCreateNow: "backup:create-now",
  backupListLogs: "backup:list-logs",
  backupRestore: "backup:restore",
  backupListCloud: "backup:list-cloud",
  backupPullCloud: "backup:pull-cloud",
  syncStatus: "sync:status",
  syncNow: "sync:now",
  printQuick: "print:quick",
  printPdf: "print:pdf",
  printQueueStatus: "print:queue-status",
  printEnqueue: "print:enqueue",
  printEnqueueHtml: "print:enqueue-html",
  printRetryJob: "print:retry-job",
  printRetryFailed: "print:retry-failed",
  printQueueChanged: "print:queue-changed",
  updateCheck: "update:check",
  posBootstrap: "pos:bootstrap",
  posGetCatalog: "pos:get-catalog",
  posGetDashboard: "pos:get-dashboard",
  posListOrders: "pos:list-orders",
  posCreateOrder: "pos:create-order",
  posUpdateOrderStatus: "pos:update-order-status",
  posUpdateOrderItems: "pos:update-order-items",
  posCompleteOrder: "pos:complete-order",
  posToggleMenuItemPin: "pos:toggle-menu-item-pin",
  posSearchCustomers: "pos:search-customers",
  posGlobalSearch: "pos:global-search",
  posGetSettings: "pos:get-settings",
  posSetSetting: "pos:set-setting",
  posUpdateSettings: "pos:update-settings",
  posSaveRestaurantLogo: "pos:save-restaurant-logo",
  settingsChanged: "settings:changed",
  posVerifyPassword: "pos:verify-password",
  posChangePassword: "pos:change-password",
  printListPrinters: "print:list-printers",
  printTest: "print:test",
  inventoryGetCatalog: "inventory:get-catalog",
  inventoryCreateMenuItem: "inventory:create-menu-item",
  inventoryUpdateMenuItem: "inventory:update-menu-item",
  inventoryDeleteMenuItem: "inventory:delete-menu-item",
  inventoryToggleMenuItem: "inventory:toggle-menu-item",
  imageLibraryList: "image-library:list",
  imageLibraryStatus: "image-library:status",
  imageLibraryDownload: "image-library:download",
  imageLibraryRetry: "image-library:retry",
  imageLibraryChanged: "image-library:changed",
  inventoryBulkCategories: "inventory:bulk-categories",
  inventoryDeleteCategory: "inventory:delete-category",
  inventoryCreateKitchen: "inventory:create-kitchen",
  inventoryUpdateKitchen: "inventory:update-kitchen",
  inventoryDeleteKitchen: "inventory:delete-kitchen",
  inventoryToggleKitchen: "inventory:toggle-kitchen",
  customersList: "customers:list",
  customersCreate: "customers:create",
  customersUpdate: "customers:update",
  customersDelete: "customers:delete",
  groceryGetStore: "grocery:get-store",
  grocerySetStore: "grocery:set-store",
  dataExportCsv: "data:export-csv",
  reportExportPdf: "report:export-pdf",
} as const;

const api = {
  activation: {
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.activationGetState),
    request: (payload: { restaurantCode: string; activationPassword: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.activationRequest, payload),
    refresh: () => ipcRenderer.invoke(IPC_CHANNELS.activationRefresh),
  },
  system: {
    status: () => ipcRenderer.invoke(IPC_CHANNELS.systemStatus),
  },
  backup: {
    createNow: (type?: BackupType) => ipcRenderer.invoke(IPC_CHANNELS.backupCreateNow, type),
    listLogs: () => ipcRenderer.invoke(IPC_CHANNELS.backupListLogs),
    restore: () => ipcRenderer.invoke(IPC_CHANNELS.backupRestore),
    listCloud: () => ipcRenderer.invoke(IPC_CHANNELS.backupListCloud),
    pullCloud: (snapshotId?: string) => ipcRenderer.invoke(IPC_CHANNELS.backupPullCloud, snapshotId),
  },
  sync: {
    status: () => ipcRenderer.invoke(IPC_CHANNELS.syncStatus),
    now: () => ipcRenderer.invoke(IPC_CHANNELS.syncNow),
  },
  print: {
    quick: () => ipcRenderer.invoke(IPC_CHANNELS.printQuick),
    pdf: () => ipcRenderer.invoke(IPC_CHANNELS.printPdf),
    listPrinters: () => ipcRenderer.invoke(IPC_CHANNELS.printListPrinters),
    test: (printerName?: string) => ipcRenderer.invoke(IPC_CHANNELS.printTest, printerName),
    queueStatus: () => ipcRenderer.invoke(IPC_CHANNELS.printQueueStatus),
    enqueue: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.printEnqueue, payload),
    enqueueHtml: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.printEnqueueHtml, payload),
    retryJob: (jobId: string) => ipcRenderer.invoke(IPC_CHANNELS.printRetryJob, jobId),
    retryFailed: () => ipcRenderer.invoke(IPC_CHANNELS.printRetryFailed),
    onQueueChanged: (listener: () => void) => {
      ipcRenderer.on(IPC_CHANNELS.printQueueChanged, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.printQueueChanged, listener);
    },
  },
  updates: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.updateCheck),
  },
  pos: {
    bootstrap: () => ipcRenderer.invoke(IPC_CHANNELS.posBootstrap),
    getCatalog: () => ipcRenderer.invoke(IPC_CHANNELS.posGetCatalog),
    getDashboard: () => ipcRenderer.invoke(IPC_CHANNELS.posGetDashboard),
    listOrders: (status?: string) => ipcRenderer.invoke(IPC_CHANNELS.posListOrders, status),
    createOrder: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.posCreateOrder, payload),
    updateOrderStatus: (payload: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.posUpdateOrderStatus, payload),
    updateOrderItems: (payload: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.posUpdateOrderItems, payload),
    completeOrder: (payload: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.posCompleteOrder, payload),
    toggleMenuItemPin: (menuItemId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.posToggleMenuItemPin, menuItemId),
    searchCustomers: (query: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.posSearchCustomers, query),
    globalSearch: (query: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.posGlobalSearch, query),
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.posGetSettings),
    setSetting: (payload: { key: string; value: string | number | boolean }) =>
      ipcRenderer.invoke(IPC_CHANNELS.posSetSetting, payload),
    updateSettings: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.posUpdateSettings, payload),
    saveRestaurantLogo: (payload: { dataUrl: string | null; password: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.posSaveRestaurantLogo, payload),
    verifyPassword: (password: string) => ipcRenderer.invoke(IPC_CHANNELS.posVerifyPassword, password),
    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.posChangePassword, payload),
    onSettingsChanged: (listener: () => void) => {
      ipcRenderer.on(IPC_CHANNELS.settingsChanged, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.settingsChanged, listener);
    },
  },
  inventory: {
    getCatalog: () => ipcRenderer.invoke(IPC_CHANNELS.inventoryGetCatalog),
    createMenuItem: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.inventoryCreateMenuItem, payload),
    updateMenuItem: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.inventoryUpdateMenuItem, payload),
    deleteMenuItem: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.inventoryDeleteMenuItem, id),
    toggleMenuItem: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.inventoryToggleMenuItem, id),
    bulkCategories: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.inventoryBulkCategories, payload),
    deleteCategory: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.inventoryDeleteCategory, id),
    createKitchen: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.inventoryCreateKitchen, payload),
    updateKitchen: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.inventoryUpdateKitchen, payload),
    deleteKitchen: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.inventoryDeleteKitchen, id),
    toggleKitchen: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.inventoryToggleKitchen, id),
  },
  imageLibrary: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.imageLibraryList),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.imageLibraryStatus),
    download: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.imageLibraryDownload, id),
    retry: () => ipcRenderer.invoke(IPC_CHANNELS.imageLibraryRetry),
    onChanged: (listener: () => void) => {
      ipcRenderer.on(IPC_CHANNELS.imageLibraryChanged, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.imageLibraryChanged, listener);
    },
  },
  customers: {
    list: (query = "") => ipcRenderer.invoke(IPC_CHANNELS.customersList, query),
    create: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.customersCreate, payload),
    update: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.customersUpdate, payload),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.customersDelete, id),
  },
  grocery: {
    getStore: () => ipcRenderer.invoke(IPC_CHANNELS.groceryGetStore),
    setStore: (store: unknown) => ipcRenderer.invoke(IPC_CHANNELS.grocerySetStore, store),
  },
  dataExport: {
    csv: (kind: "orders" | "customers" | "inventory") =>
      ipcRenderer.invoke(IPC_CHANNELS.dataExportCsv, kind),
    reportPdf: (payload: { title: string; startDate?: string; endDate?: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.reportExportPdf, payload),
  },
};

contextBridge.exposeInMainWorld("restrozapp", api);
