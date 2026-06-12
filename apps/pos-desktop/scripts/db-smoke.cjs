const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app } = require("electron");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "restrozapp-db-smoke-"));
process.env.RESTROZAPP_DATA_ROOT = root;

app.whenReady().then(() => {
  try {
    const databaseModule = require("../dist/main/database/database.js");
    const database = databaseModule.openRestaurantDatabase("SMOKE-001");
    const integrity = database.pragma("integrity_check", { simple: true });
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name);
    const required = [
      "orders",
      "order_items",
      "print_jobs",
      "sync_outbox",
      "cloud_snapshot_queue",
      "grocery_vendors",
      "grocery_purchases",
      "menu_search",
    ];
    const seededCategories = database.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
    databaseModule.beginDatabaseReplacement("SMOKE-001");
    let replacementLockWorks = false;
    try {
      databaseModule.withActivatedDatabase("SMOKE-001", () => undefined);
    } catch (error) {
      replacementLockWorks = String(error.message).includes("recovery is in progress");
    }
    databaseModule.withActivatedDatabase("SMOKE-001", () => undefined, true);
    databaseModule.endDatabaseReplacement("SMOKE-001");
    databaseModule.closeAllRestaurantDatabases();
    const reopened = databaseModule.openRestaurantDatabase("SMOKE-001");
    const migrations = reopened.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count;
    databaseModule.closeAllRestaurantDatabases();
    console.log(JSON.stringify({
      integrity,
      migrations,
      requiredTables: required.every((name) => tables.includes(name)),
      productionStartsEmpty: seededCategories === 0,
      replacementLockWorks,
    }));
    process.exitCode =
      integrity === "ok" &&
      migrations >= 11 &&
      required.every((name) => tables.includes(name)) &&
      seededCategories === 0 &&
      replacementLockWorks
        ? 0
        : 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    app.quit();
  }
});
