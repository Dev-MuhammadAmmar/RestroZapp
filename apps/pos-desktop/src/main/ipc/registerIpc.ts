import {
  dialog,
  ipcMain,
  type BrowserWindow,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
} from "electron";
import { IPC_CHANNELS, type BackupType } from "@restrozapp/shared";
import { getActivationState, refreshActivationStatus, requestActivation } from "../services/activationService";
import {
  createBackupNow,
  listBackupLogs,
  listCloudSnapshots,
  pullCloudSnapshot,
  pushCloudSnapshot,
  restoreBackup,
} from "../services/backupService";
import { listPrinters, quickPrint, savePdf, testPrint } from "../services/printService";
import {
  completeOrder,
  bulkUpdateCategories,
  createKitchen,
  createMenuItem,
  createOrder,
  createCustomer,
  deleteCategory,
  deleteKitchen,
  deleteMenuItem,
  deleteCustomer,
  getCatalog,
  getPosBootstrap,
  getDashboardSummary,
  getInventoryCatalog,
  getPosSettings,
  listOrders,
  globalSearch,
  searchCustomers,
  setPosSetting,
  saveRestaurantLogo,
  updatePosSettings,
  verifyPosSettingsPassword,
  changePosSettingsPassword,
  toggleKitchenStatus,
  toggleMenuItemPin,
  toggleMenuItemStatus,
  updateKitchen,
  updateMenuItem,
  updateCustomer,
  updateOrderItems,
  updateOrderStatus,
  enqueueOrderPrint,
  invalidatePosBootstrapCache,
} from "../services/posService";
import { getSystemStatus } from "../services/systemService";
import { checkForUpdates } from "../services/updateService";
import { getGroceryStore, setGroceryStore } from "../services/groceryService";
import { getSyncStatus, syncNow } from "../services/syncService";
import {
  getPrintQueueStatus,
  enqueueHtmlPrint,
  retryAllFailedPrintJobs,
  retryPrintJob,
  wakePrintWorker,
} from "../services/printQueueService";
import {
  getFoodImageLibraryStatus,
  listFoodImages,
  prioritizeFoodImage,
  retryFoodImages,
} from "../services/imageLibraryService";
import { exportCsv, exportReportPdf } from "../services/exportService";

export function registerIpc(getWindow: () => BrowserWindow | null) {
  const handle = (
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: any[]) => unknown,
  ) => {
    ipcMain.handle(channel, (event, ...args) => {
      const senderUrl = event.senderFrame?.url || "";
      const mainUrl = getWindow()?.webContents.getURL() || "";
      const trustedDevelopmentUrl =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(?:127\.0\.0\.1|localhost):5173(?:\/|$)/.test(senderUrl);
      if (senderUrl !== mainUrl && !trustedDevelopmentUrl) {
        throw new Error("Blocked IPC request from an untrusted renderer.");
      }
      return handler(event, ...args);
    });
  };
  handle(IPC_CHANNELS.activationGetState, () => getActivationState());
  handle(IPC_CHANNELS.activationRequest, (_event, payload) => requestActivation(payload));
  handle(IPC_CHANNELS.activationRefresh, () => refreshActivationStatus());
  handle(IPC_CHANNELS.systemStatus, () => getSystemStatus());
  handle(IPC_CHANNELS.backupCreateNow, (_event, type?: BackupType) =>
    type === "manual" || !type ? pushCloudSnapshot("manual") : createBackupNow(type));
  handle(IPC_CHANNELS.backupListLogs, () => listBackupLogs());
  handle(IPC_CHANNELS.backupListCloud, () => listCloudSnapshots());
  handle(IPC_CHANNELS.backupPullCloud, (_event, snapshotId?: string) => pullCloudSnapshot(snapshotId));
  handle(IPC_CHANNELS.syncStatus, () => getSyncStatus());
  handle(IPC_CHANNELS.syncNow, () => syncNow());
  handle(IPC_CHANNELS.printQuick, () => quickPrint(getWindow()));
  handle(IPC_CHANNELS.printPdf, () => savePdf(getWindow()));
  handle(IPC_CHANNELS.printListPrinters, () => listPrinters(getWindow()));
  handle(IPC_CHANNELS.printTest, (_event, printerName?: string) => testPrint(getWindow(), printerName));
  handle(IPC_CHANNELS.printQueueStatus, () => getPrintQueueStatus());
  handle(IPC_CHANNELS.printEnqueue, (_event, payload) => {
    const result = enqueueOrderPrint(payload);
    if (result.ok) wakePrintWorker();
    return result;
  });
  handle(IPC_CHANNELS.printEnqueueHtml, (_event, payload) => {
    const result = enqueueHtmlPrint(payload);
    if (result.ok) wakePrintWorker();
    return result;
  });
  handle(IPC_CHANNELS.printRetryJob, (_event, jobId: string) => retryPrintJob(jobId));
  handle(IPC_CHANNELS.printRetryFailed, () => retryAllFailedPrintJobs());
  handle(IPC_CHANNELS.updateCheck, () => checkForUpdates());
  handle(IPC_CHANNELS.posBootstrap, () => getPosBootstrap());
  handle(IPC_CHANNELS.posGetCatalog, () => getCatalog());
  handle(IPC_CHANNELS.posGetDashboard, () => getDashboardSummary());
  handle(IPC_CHANNELS.posListOrders, (_event, status?: string) => listOrders(status));
  handle(IPC_CHANNELS.posCreateOrder, (_event, payload) => {
    const result = createOrder(payload);
    if (result.ok) {
      invalidatePosBootstrapCache();
      wakePrintWorker();
    }
    return result;
  });
  handle(IPC_CHANNELS.posUpdateOrderStatus, (_event, payload) => {
    const result = updateOrderStatus(payload);
    if (result.ok) invalidatePosBootstrapCache();
    return result;
  });
  handle(IPC_CHANNELS.posUpdateOrderItems, (_event, payload) => {
    const result = updateOrderItems(payload);
    if (result.ok) invalidatePosBootstrapCache();
    return result;
  });
  handle(IPC_CHANNELS.posCompleteOrder, (_event, payload) => {
    const result = completeOrder(payload);
    if (result.ok) {
      invalidatePosBootstrapCache();
      wakePrintWorker();
    }
    return result;
  });
  handle(IPC_CHANNELS.posToggleMenuItemPin, (_event, menuItemId) => toggleMenuItemPin(menuItemId));
  handle(IPC_CHANNELS.posSearchCustomers, (_event, query) => searchCustomers(query));
  handle(IPC_CHANNELS.posGlobalSearch, (_event, query) => globalSearch(query));
  handle(IPC_CHANNELS.posGetSettings, () => getPosSettings());
  handle(IPC_CHANNELS.posSetSetting, (_event, payload) => {
    const result = setPosSetting(payload);
    if (result.ok) {
      invalidatePosBootstrapCache();
      getWindow()?.webContents.send(IPC_CHANNELS.settingsChanged);
    }
    return result;
  });
  handle(IPC_CHANNELS.posUpdateSettings, (_event, payload) => {
    const result = updatePosSettings(payload);
    if (result.ok) {
      invalidatePosBootstrapCache();
      getWindow()?.webContents.send(IPC_CHANNELS.settingsChanged);
    }
    return result;
  });
  handle(IPC_CHANNELS.posSaveRestaurantLogo, (_event, payload) => {
    const result = saveRestaurantLogo(payload);
    if (result.ok) getWindow()?.webContents.send(IPC_CHANNELS.settingsChanged);
    return result;
  });
  handle(IPC_CHANNELS.posVerifyPassword, (_event, password) => verifyPosSettingsPassword(password));
  handle(IPC_CHANNELS.posChangePassword, (_event, payload) => changePosSettingsPassword(payload));
  handle(IPC_CHANNELS.inventoryGetCatalog, () => getInventoryCatalog());
  handle(IPC_CHANNELS.imageLibraryList, () => ({ ok: true as const, data: listFoodImages() }));
  handle(IPC_CHANNELS.imageLibraryStatus, () => getFoodImageLibraryStatus());
  handle(IPC_CHANNELS.imageLibraryDownload, (_event, id: string) => prioritizeFoodImage(id));
  handle(IPC_CHANNELS.imageLibraryRetry, () => retryFoodImages());
  const inventoryMutation = (operation: (...args: any[]) => any) => (...args: any[]) => {
    const result = operation(...args);
    if (result.ok) invalidatePosBootstrapCache();
    return result;
  };
  handle(IPC_CHANNELS.inventoryCreateMenuItem, (_event, payload) => inventoryMutation(createMenuItem)(payload));
  handle(IPC_CHANNELS.inventoryUpdateMenuItem, (_event, payload) => inventoryMutation(updateMenuItem)(payload));
  handle(IPC_CHANNELS.inventoryDeleteMenuItem, (_event, id) => inventoryMutation(deleteMenuItem)(id));
  handle(IPC_CHANNELS.inventoryToggleMenuItem, (_event, id) => inventoryMutation(toggleMenuItemStatus)(id));
  handle(IPC_CHANNELS.inventoryBulkCategories, (_event, payload) => inventoryMutation(bulkUpdateCategories)(payload));
  handle(IPC_CHANNELS.inventoryDeleteCategory, (_event, id) => inventoryMutation(deleteCategory)(id));
  handle(IPC_CHANNELS.inventoryCreateKitchen, (_event, payload) => inventoryMutation(createKitchen)(payload));
  handle(IPC_CHANNELS.inventoryUpdateKitchen, (_event, payload) => inventoryMutation(updateKitchen)(payload));
  handle(IPC_CHANNELS.inventoryDeleteKitchen, (_event, id) => inventoryMutation(deleteKitchen)(id));
  handle(IPC_CHANNELS.inventoryToggleKitchen, (_event, id) => inventoryMutation(toggleKitchenStatus)(id));
  handle(IPC_CHANNELS.customersList, (_event, query = "") => searchCustomers(query));
  handle(IPC_CHANNELS.customersCreate, (_event, payload) => createCustomer(payload));
  handle(IPC_CHANNELS.customersUpdate, (_event, payload) => updateCustomer(payload));
  handle(IPC_CHANNELS.customersDelete, (_event, id) => deleteCustomer(id));
  handle(IPC_CHANNELS.groceryGetStore, () => getGroceryStore());
  handle(IPC_CHANNELS.grocerySetStore, (_event, store) => setGroceryStore(store));
  handle(IPC_CHANNELS.dataExportCsv, (_event, kind) => exportCsv(kind));
  handle(IPC_CHANNELS.reportExportPdf, (_event, payload) => exportReportPdf(payload));
  handle(IPC_CHANNELS.backupRestore, async () => {
    const parentWindow = getWindow();
    const options: OpenDialogOptions = {
      title: "Restore backup",
      properties: ["openFile"],
      filters: [{ name: "Backup ZIP", extensions: ["zip"] }],
    };
    const selection = parentWindow
      ? await dialog.showOpenDialog(parentWindow, options)
      : await dialog.showOpenDialog(options);
    if (selection.canceled || !selection.filePaths[0]) {
      return { ok: false, error: "Restore cancelled." };
    }
    return restoreBackup(selection.filePaths[0]);
  });
}
