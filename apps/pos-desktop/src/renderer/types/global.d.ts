import type {
  ApiResult,
  BackupLog,
  BackupType,
  CloudSnapshot,
  CompleteOrderInput,
  CreateOrderInput,
  FoodImageAsset,
  FoodImageLibraryStatus,
  GlobalSearchResponse,
  PosCatalog,
  PosBootstrap,
  PosCustomer,
  PosDashboardSummary,
  PosOrder,
  PosSettings,
  PosSettingsUpdate,
  PrinterInfo,
  PrintEnqueueRequest,
  HtmlPrintEnqueueRequest,
  PrintQueueStatus,
  OrderCommitResult,
  SystemStatus,
  SyncStatus,
  UpdateOrderItemsInput,
} from "@restrozapp/shared";

declare global {
  interface Window {
    restrozapp: {
      activation: {
        getState: () => Promise<unknown>;
        request: (payload: { restaurantCode: string; activationPassword: string }) => Promise<unknown>;
        refresh: () => Promise<unknown>;
      };
      system: {
        status: () => Promise<SystemStatus>;
      };
      backup: {
        createNow: (type?: BackupType) => Promise<ApiResult<BackupLog>>;
        listLogs: () => Promise<ApiResult<BackupLog[]>>;
        restore: () => Promise<ApiResult<unknown>>;
        listCloud: () => Promise<ApiResult<CloudSnapshot[]>>;
        pullCloud: (snapshotId?: string) => Promise<ApiResult<{ restored: true }>>;
      };
      sync: {
        status: () => Promise<SyncStatus>;
        now: () => Promise<ApiResult<SyncStatus>>;
      };
      print: {
        quick: () => Promise<ApiResult<{ printed: true }>>;
        pdf: () => Promise<ApiResult<{ path: string }>>;
        listPrinters: () => Promise<ApiResult<PrinterInfo[]>>;
        test: (printerName?: string) => Promise<ApiResult<{ printed: true }>>;
        queueStatus: () => Promise<PrintQueueStatus>;
        enqueue: (payload: PrintEnqueueRequest) => Promise<ApiResult<{ queued: true }>>;
        enqueueHtml: (payload: HtmlPrintEnqueueRequest) => Promise<ApiResult<{ queued: true }>>;
        retryJob: (jobId: string) => Promise<ApiResult<PrintQueueStatus>>;
        retryFailed: () => Promise<ApiResult<PrintQueueStatus>>;
        onQueueChanged: (listener: () => void) => () => void;
      };
      updates: {
        check: () => Promise<unknown>;
      };
      pos: {
        bootstrap: () => Promise<ApiResult<PosBootstrap>>;
        getCatalog: () => Promise<ApiResult<PosCatalog>>;
        getDashboard: () => Promise<ApiResult<PosDashboardSummary>>;
        listOrders: (status?: string) => Promise<ApiResult<PosOrder[]>>;
        createOrder: (payload: CreateOrderInput) => Promise<ApiResult<OrderCommitResult>>;
        updateOrderStatus: (payload: {
          orderId: string;
          status: PosOrder["status"];
        }) => Promise<ApiResult<PosOrder>>;
        updateOrderItems: (payload: UpdateOrderItemsInput) => Promise<ApiResult<PosOrder>>;
        completeOrder: (payload: CompleteOrderInput) => Promise<ApiResult<PosOrder>>;
        toggleMenuItemPin: (menuItemId: string) => Promise<ApiResult<{ id: string; isPinned: boolean }>>;
        searchCustomers: (query: string) => Promise<ApiResult<PosCustomer[]>>;
        globalSearch: (query: string) => Promise<ApiResult<GlobalSearchResponse>>;
        getSettings: () => Promise<ApiResult<PosSettings>>;
        setSetting: (payload: {
          key: string;
          value: string | number | boolean;
        }) => Promise<ApiResult<{ key: string; value: string | number | boolean }>>;
        updateSettings: (payload: PosSettingsUpdate) => Promise<ApiResult<PosSettings>>;
        saveRestaurantLogo: (payload: {
          dataUrl: string | null;
          password: string;
        }) => Promise<ApiResult<PosSettings>>;
        verifyPassword: (password: string) => Promise<ApiResult<{ valid: boolean }>>;
        changePassword: (payload: {
          currentPassword: string;
          newPassword: string;
        }) => Promise<ApiResult<{ changed: true }>>;
        onSettingsChanged: (listener: () => void) => () => void;
      };
      inventory: {
        getCatalog: () => Promise<ApiResult<PosCatalog>>;
        createMenuItem: (payload: unknown) => Promise<ApiResult<PosCatalog["menuItems"][number]>>;
        updateMenuItem: (payload: unknown) => Promise<ApiResult<PosCatalog["menuItems"][number]>>;
        deleteMenuItem: (id: string) => Promise<ApiResult<{ id: string }>>;
        toggleMenuItem: (id: string) => Promise<ApiResult<PosCatalog["menuItems"][number]>>;
        bulkCategories: (payload: unknown) => Promise<ApiResult<PosCatalog["categories"]>>;
        deleteCategory: (id: string) => Promise<ApiResult<{ id: string }>>;
        createKitchen: (payload: unknown) => Promise<ApiResult<PosCatalog["kitchens"][number]>>;
        updateKitchen: (payload: unknown) => Promise<ApiResult<PosCatalog["kitchens"][number]>>;
        deleteKitchen: (id: string) => Promise<ApiResult<{ id: string }>>;
        toggleKitchen: (id: string) => Promise<ApiResult<PosCatalog["kitchens"][number]>>;
      };
      imageLibrary: {
        list: () => Promise<ApiResult<FoodImageAsset[]>>;
        status: () => Promise<FoodImageLibraryStatus>;
        download: (id: string) => Promise<ApiResult<{ queued: true }>>;
        retry: () => Promise<ApiResult<FoodImageLibraryStatus>>;
        onChanged: (listener: () => void) => () => void;
      };
      customers: {
        list: (query?: string) => Promise<ApiResult<PosCustomer[]>>;
        create: (payload: unknown) => Promise<ApiResult<PosCustomer>>;
        update: (payload: unknown) => Promise<ApiResult<PosCustomer>>;
        delete: (id: string) => Promise<ApiResult<{ id: string }>>;
      };
      grocery: {
        getStore: () => Promise<ApiResult<{ groceries: unknown[]; vendors: unknown[] }>>;
        setStore: (store: unknown) => Promise<ApiResult<unknown>>;
      };
      dataExport: {
        csv: (kind: "orders" | "customers" | "inventory") => Promise<ApiResult<{ path: string }>>;
        reportPdf: (payload: {
          title: string;
          startDate?: string;
          endDate?: string;
        }) => Promise<ApiResult<{ path: string }>>;
      };
    };
  }
}

export {};
