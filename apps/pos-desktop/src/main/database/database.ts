import Database from "better-sqlite3";
import { getDatabasePath } from "../config/paths";

export type PosDatabase = Database.Database;
const databaseConnections = new Map<string, PosDatabase>();
let replacementRestaurantCode: string | null = null;

const migrations = [
  {
    id: 1,
    name: "foundation",
    sql: `
      CREATE TABLE IF NOT EXISTS local_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS backup_logs (
        id TEXT PRIMARY KEY,
        restaurant_code TEXT NOT NULL,
        device_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        file_name TEXT NOT NULL,
        local_path TEXT NOT NULL,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        uploaded_at TEXT,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS print_jobs (
        id TEXT PRIMARY KEY,
        receipt_type TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        category_id TEXT,
        kitchen_id TEXT,
        name TEXT NOT NULL,
        cost_price REAL NOT NULL DEFAULT 0,
        selling_price REAL NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        order_type TEXT NOT NULL,
        status TEXT NOT NULL,
        subtotal REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        customer_name TEXT NOT NULL DEFAULT 'Guest',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        menu_item_id TEXT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `,
  },
  {
    id: 2,
    name: "offline_pos_operations",
    sql: `
      CREATE TABLE IF NOT EXISTS kitchens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#475569',
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '#047857';
      ALTER TABLE menu_items ADD COLUMN description TEXT NOT NULL DEFAULT '';
      ALTER TABLE menu_items ADD COLUMN preparation_time TEXT NOT NULL DEFAULT '';
      ALTER TABLE menu_items ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE menu_items ADD COLUMN pinned_at TEXT;

      ALTER TABLE orders ADD COLUMN token_number TEXT NOT NULL DEFAULT '';
      ALTER TABLE orders ADD COLUMN tax REAL NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN tax_percentage REAL NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN delivery_charge REAL NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN total_cost REAL NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN total_profit REAL NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN phone_number TEXT NOT NULL DEFAULT '';
      ALTER TABLE orders ADD COLUMN table_number TEXT NOT NULL DEFAULT '';
      ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT '';
      ALTER TABLE orders ADD COLUMN notes TEXT NOT NULL DEFAULT '';
      ALTER TABLE orders ADD COLUMN completed_at TEXT;

      ALTER TABLE order_items ADD COLUMN kitchen_id TEXT;
      ALTER TABLE order_items ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);
      CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    `,
  },
  {
    id: 3,
    name: "restrozapp_pos_features",
    sql: `
      ALTER TABLE order_items ADD COLUMN category_id TEXT;
      ALTER TABLE order_items ADD COLUMN icon TEXT NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        order_count INTEGER NOT NULL DEFAULT 0,
        total_spent REAL NOT NULL DEFAULT 0,
        last_order_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

      UPDATE categories SET icon = '' WHERE id = 'cat-main';
      UPDATE categories SET icon = '' WHERE id = 'cat-bbq';
      UPDATE categories SET icon = '' WHERE id = 'cat-drinks';
      UPDATE categories SET icon = '' WHERE id = 'cat-sides';

      UPDATE kitchens SET icon = '' WHERE id = 'kit-main';
      UPDATE kitchens SET icon = '' WHERE id = 'kit-bbq';
      UPDATE kitchens SET icon = '' WHERE id = 'kit-bar';
    `,
  },
  {
    id: 4,
    name: "customer_and_kitchen_details",
    sql: `
      ALTER TABLE customers ADD COLUMN notes TEXT NOT NULL DEFAULT '';
      ALTER TABLE kitchens ADD COLUMN description TEXT NOT NULL DEFAULT '';
    `,
  },
  {
    id: 5,
    name: "professional_settings_security",
    sql: `
      CREATE TABLE IF NOT EXISTS local_secrets (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    id: 6,
    name: "continuous_sync_and_grocery_persistence",
    raw: true,
    sql: `
      CREATE TABLE IF NOT EXISTS sync_outbox (
        event_id TEXT PRIMARY KEY,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT,
        occurred_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grocery_store (
        id TEXT PRIMARY KEY CHECK (id = 'primary'),
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO grocery_store (id, value) VALUES ('primary', '{"groceries":[],"vendors":[]}');
      INSERT OR IGNORE INTO sync_state (key, value) VALUES ('last_cloud_sequence', '0');
      INSERT OR IGNORE INTO sync_state (key, value) VALUES ('suppress_outbox', '0');

      CREATE TRIGGER IF NOT EXISTS sync_categories_insert AFTER INSERT ON categories
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'categories', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'is_active',NEW.is_active,'created_at',NEW.created_at,'color',NEW.color), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_categories_update AFTER UPDATE ON categories
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'categories', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'is_active',NEW.is_active,'created_at',NEW.created_at,'color',NEW.color), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_categories_delete AFTER DELETE ON categories
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'categories', OLD.id, 'delete', NULL, datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_kitchens_insert AFTER INSERT ON kitchens
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'kitchens', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'color',NEW.color,'is_active',NEW.is_active,'display_order',NEW.display_order,'created_at',NEW.created_at,'description',NEW.description), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_kitchens_update AFTER UPDATE ON kitchens
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'kitchens', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'color',NEW.color,'is_active',NEW.is_active,'display_order',NEW.display_order,'created_at',NEW.created_at,'description',NEW.description), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_kitchens_delete AFTER DELETE ON kitchens
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'kitchens', OLD.id, 'delete', NULL, datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_menu_items_insert AFTER INSERT ON menu_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'menu_items', NEW.id, 'upsert', json_object('id',NEW.id,'category_id',NEW.category_id,'kitchen_id',NEW.kitchen_id,'name',NEW.name,'description',NEW.description,'selling_price',NEW.selling_price,'preparation_time',NEW.preparation_time,'is_pinned',NEW.is_pinned,'pinned_at',NEW.pinned_at,'is_active',NEW.is_active,'created_at',NEW.created_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_menu_items_update AFTER UPDATE ON menu_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'menu_items', NEW.id, 'upsert', json_object('id',NEW.id,'category_id',NEW.category_id,'kitchen_id',NEW.kitchen_id,'name',NEW.name,'description',NEW.description,'selling_price',NEW.selling_price,'preparation_time',NEW.preparation_time,'is_pinned',NEW.is_pinned,'pinned_at',NEW.pinned_at,'is_active',NEW.is_active,'created_at',NEW.created_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_menu_items_delete AFTER DELETE ON menu_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'menu_items', OLD.id, 'delete', NULL, datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_orders_insert AFTER INSERT ON orders
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'orders', NEW.id, 'upsert', json_object('id',NEW.id,'order_number',NEW.order_number,'order_type',NEW.order_type,'status',NEW.status,'subtotal',NEW.subtotal,'total',NEW.total,'payment_method',NEW.payment_method,'customer_name',NEW.customer_name,'created_at',NEW.created_at,'token_number',NEW.token_number,'tax',NEW.tax,'tax_percentage',NEW.tax_percentage,'discount_amount',NEW.discount_amount,'delivery_charge',NEW.delivery_charge,'phone_number',NEW.phone_number,'table_number',NEW.table_number,'address',NEW.address,'notes',NEW.notes,'completed_at',NEW.completed_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_orders_update AFTER UPDATE ON orders
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'orders', NEW.id, 'upsert', json_object('id',NEW.id,'order_number',NEW.order_number,'order_type',NEW.order_type,'status',NEW.status,'subtotal',NEW.subtotal,'total',NEW.total,'payment_method',NEW.payment_method,'customer_name',NEW.customer_name,'created_at',NEW.created_at,'token_number',NEW.token_number,'tax',NEW.tax,'tax_percentage',NEW.tax_percentage,'discount_amount',NEW.discount_amount,'delivery_charge',NEW.delivery_charge,'phone_number',NEW.phone_number,'table_number',NEW.table_number,'address',NEW.address,'notes',NEW.notes,'completed_at',NEW.completed_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_orders_delete AFTER DELETE ON orders
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'orders', OLD.id, 'delete', NULL, datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_order_items_insert AFTER INSERT ON order_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'order_items', NEW.id, 'upsert', json_object('id',NEW.id,'order_id',NEW.order_id,'menu_item_id',NEW.menu_item_id,'name',NEW.name,'price',NEW.price,'quantity',NEW.quantity,'kitchen_id',NEW.kitchen_id,'category_id',NEW.category_id,'icon',NEW.icon), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_order_items_update AFTER UPDATE ON order_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'order_items', NEW.id, 'upsert', json_object('id',NEW.id,'order_id',NEW.order_id,'menu_item_id',NEW.menu_item_id,'name',NEW.name,'price',NEW.price,'quantity',NEW.quantity,'kitchen_id',NEW.kitchen_id,'category_id',NEW.category_id,'icon',NEW.icon), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_order_items_delete AFTER DELETE ON order_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'order_items', OLD.id, 'delete', NULL, datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_customers_insert AFTER INSERT ON customers
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'customers', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'phone_number',NEW.phone_number,'address',NEW.address,'email',NEW.email,'order_count',NEW.order_count,'total_spent',NEW.total_spent,'last_order_date',NEW.last_order_date,'is_active',NEW.is_active,'created_at',NEW.created_at,'updated_at',NEW.updated_at,'notes',NEW.notes), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_customers_update AFTER UPDATE ON customers
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'customers', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'phone_number',NEW.phone_number,'address',NEW.address,'email',NEW.email,'order_count',NEW.order_count,'total_spent',NEW.total_spent,'last_order_date',NEW.last_order_date,'is_active',NEW.is_active,'created_at',NEW.created_at,'updated_at',NEW.updated_at,'notes',NEW.notes), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_customers_delete AFTER DELETE ON customers
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'customers', OLD.id, 'delete', NULL, datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_local_settings_insert AFTER INSERT ON local_settings
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'local_settings', NEW.key, 'upsert', json_object('key',NEW.key,'value',NEW.value,'updated_at',NEW.updated_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER IF NOT EXISTS sync_local_settings_update AFTER UPDATE ON local_settings
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'local_settings', NEW.key, 'upsert', json_object('key',NEW.key,'value',NEW.value,'updated_at',NEW.updated_at), datetime('now'), 'pending', 0, NULL);
      END;

      CREATE TRIGGER IF NOT EXISTS sync_grocery_store_update AFTER UPDATE ON grocery_store
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'grocery_store', NEW.id, 'upsert', json_object('id',NEW.id,'value',NEW.value,'updated_at',NEW.updated_at), datetime('now'), 'pending', 0, NULL);
      END;
    `,
  },
  {
    id: 7,
    name: "fast_pos_and_durable_print_queue",
    sql: `
      ALTER TABLE orders ADD COLUMN client_request_id TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_request
        ON orders(client_request_id)
        WHERE client_request_id IS NOT NULL;

      ALTER TABLE print_jobs ADD COLUMN order_id TEXT NOT NULL DEFAULT '';
      ALTER TABLE print_jobs ADD COLUMN kitchen_id TEXT;
      ALTER TABLE print_jobs ADD COLUMN kitchen_name TEXT NOT NULL DEFAULT '';
      ALTER TABLE print_jobs ADD COLUMN payload TEXT NOT NULL DEFAULT '{}';
      ALTER TABLE print_jobs ADD COLUMN printer_name TEXT NOT NULL DEFAULT '';
      ALTER TABLE print_jobs ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE print_jobs ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 10;
      ALTER TABLE print_jobs ADD COLUMN next_attempt_at TEXT;
      ALTER TABLE print_jobs ADD COLUMN started_at TEXT;
      ALTER TABLE print_jobs ADD COLUMN printed_at TEXT;
      ALTER TABLE print_jobs ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
      CREATE INDEX IF NOT EXISTS idx_print_jobs_ready
        ON print_jobs(status, next_attempt_at, created_at);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON print_jobs(order_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status_created
        ON orders(status, created_at DESC);
    `,
  },
  {
    id: 8,
    name: "menu_item_images",
    sql: `
      ALTER TABLE menu_items ADD COLUMN image_file TEXT NOT NULL DEFAULT '';
    `,
  },
  {
    id: 9,
    name: "professional_catalog_search_and_grocery",
    raw: true,
    sql: `
      ALTER TABLE order_items ADD COLUMN image_file TEXT NOT NULL DEFAULT '';

      UPDATE categories SET icon = '';
      UPDATE kitchens SET icon = '';
      UPDATE order_items SET icon = '', cost_price = 0;
      UPDATE menu_items SET cost_price = 0;
      UPDATE orders SET total_cost = 0, total_profit = 0;

      CREATE TABLE IF NOT EXISTS grocery_vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS grocery_purchases (
        id TEXT PRIMARY KEY,
        vendor_id TEXT,
        vendor_name TEXT NOT NULL DEFAULT '',
        invoice_number TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'PENDING',
        payment_method TEXT NOT NULL DEFAULT 'CASH',
        total REAL NOT NULL DEFAULT 0,
        purchase_date TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS grocery_purchase_items (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT '',
        unit_price REAL NOT NULL DEFAULT 0,
        payload TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY(purchase_id) REFERENCES grocery_purchases(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS grocery_payments (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'CASH',
        paid_at TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY(purchase_id) REFERENCES grocery_purchases(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS grocery_returns (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        returned_at TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY(purchase_id) REFERENCES grocery_purchases(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_grocery_vendor_name ON grocery_vendors(name);
      CREATE INDEX IF NOT EXISTS idx_grocery_purchase_vendor ON grocery_purchases(vendor_name);
      CREATE INDEX IF NOT EXISTS idx_grocery_purchase_date ON grocery_purchases(purchase_date DESC);
      CREATE INDEX IF NOT EXISTS idx_grocery_item_name ON grocery_purchase_items(name);

      DROP TRIGGER IF EXISTS sync_categories_insert;
      DROP TRIGGER IF EXISTS sync_categories_update;
      DROP TRIGGER IF EXISTS sync_kitchens_insert;
      DROP TRIGGER IF EXISTS sync_kitchens_update;
      DROP TRIGGER IF EXISTS sync_menu_items_insert;
      DROP TRIGGER IF EXISTS sync_menu_items_update;
      DROP TRIGGER IF EXISTS sync_orders_insert;
      DROP TRIGGER IF EXISTS sync_orders_update;
      DROP TRIGGER IF EXISTS sync_order_items_insert;
      DROP TRIGGER IF EXISTS sync_order_items_update;

      CREATE TRIGGER sync_categories_insert AFTER INSERT ON categories
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'categories', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'is_active',NEW.is_active,'created_at',NEW.created_at,'color',NEW.color), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_categories_update AFTER UPDATE ON categories
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'categories', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'is_active',NEW.is_active,'created_at',NEW.created_at,'color',NEW.color), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_kitchens_insert AFTER INSERT ON kitchens
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'kitchens', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'color',NEW.color,'is_active',NEW.is_active,'display_order',NEW.display_order,'created_at',NEW.created_at,'description',NEW.description), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_kitchens_update AFTER UPDATE ON kitchens
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'kitchens', NEW.id, 'upsert', json_object('id',NEW.id,'name',NEW.name,'color',NEW.color,'is_active',NEW.is_active,'display_order',NEW.display_order,'created_at',NEW.created_at,'description',NEW.description), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_menu_items_insert AFTER INSERT ON menu_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'menu_items', NEW.id, 'upsert', json_object('id',NEW.id,'category_id',NEW.category_id,'kitchen_id',NEW.kitchen_id,'name',NEW.name,'image_file',NEW.image_file,'description',NEW.description,'selling_price',NEW.selling_price,'preparation_time',NEW.preparation_time,'is_pinned',NEW.is_pinned,'pinned_at',NEW.pinned_at,'is_active',NEW.is_active,'created_at',NEW.created_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_menu_items_update AFTER UPDATE ON menu_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'menu_items', NEW.id, 'upsert', json_object('id',NEW.id,'category_id',NEW.category_id,'kitchen_id',NEW.kitchen_id,'name',NEW.name,'image_file',NEW.image_file,'description',NEW.description,'selling_price',NEW.selling_price,'preparation_time',NEW.preparation_time,'is_pinned',NEW.is_pinned,'pinned_at',NEW.pinned_at,'is_active',NEW.is_active,'created_at',NEW.created_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_orders_insert AFTER INSERT ON orders
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'orders', NEW.id, 'upsert', json_object('id',NEW.id,'order_number',NEW.order_number,'order_type',NEW.order_type,'status',NEW.status,'subtotal',NEW.subtotal,'total',NEW.total,'payment_method',NEW.payment_method,'customer_name',NEW.customer_name,'created_at',NEW.created_at,'token_number',NEW.token_number,'tax',NEW.tax,'tax_percentage',NEW.tax_percentage,'discount_amount',NEW.discount_amount,'delivery_charge',NEW.delivery_charge,'phone_number',NEW.phone_number,'table_number',NEW.table_number,'address',NEW.address,'notes',NEW.notes,'completed_at',NEW.completed_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_orders_update AFTER UPDATE ON orders
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'orders', NEW.id, 'upsert', json_object('id',NEW.id,'order_number',NEW.order_number,'order_type',NEW.order_type,'status',NEW.status,'subtotal',NEW.subtotal,'total',NEW.total,'payment_method',NEW.payment_method,'customer_name',NEW.customer_name,'created_at',NEW.created_at,'token_number',NEW.token_number,'tax',NEW.tax,'tax_percentage',NEW.tax_percentage,'discount_amount',NEW.discount_amount,'delivery_charge',NEW.delivery_charge,'phone_number',NEW.phone_number,'table_number',NEW.table_number,'address',NEW.address,'notes',NEW.notes,'completed_at',NEW.completed_at), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_order_items_insert AFTER INSERT ON order_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'order_items', NEW.id, 'upsert', json_object('id',NEW.id,'order_id',NEW.order_id,'menu_item_id',NEW.menu_item_id,'name',NEW.name,'price',NEW.price,'quantity',NEW.quantity,'kitchen_id',NEW.kitchen_id,'category_id',NEW.category_id,'image_file',NEW.image_file), datetime('now'), 'pending', 0, NULL);
      END;
      CREATE TRIGGER sync_order_items_update AFTER UPDATE ON order_items
      WHEN COALESCE((SELECT value FROM sync_state WHERE key = 'suppress_outbox'), '0') <> '1'
      BEGIN
        INSERT INTO sync_outbox VALUES (lower(hex(randomblob(16))), 'order_items', NEW.id, 'upsert', json_object('id',NEW.id,'order_id',NEW.order_id,'menu_item_id',NEW.menu_item_id,'name',NEW.name,'price',NEW.price,'quantity',NEW.quantity,'kitchen_id',NEW.kitchen_id,'category_id',NEW.category_id,'image_file',NEW.image_file), datetime('now'), 'pending', 0, NULL);
      END;
    `,
  },
  {
    id: 10,
    name: "restrozapp_fts_search",
    raw: true,
    sql: `
      CREATE VIRTUAL TABLE IF NOT EXISTS menu_search USING fts5(id UNINDEXED, name, details);
      CREATE VIRTUAL TABLE IF NOT EXISTS order_search USING fts5(id UNINDEXED, title, details);
      CREATE VIRTUAL TABLE IF NOT EXISTS customer_search USING fts5(id UNINDEXED, name, details);
      CREATE VIRTUAL TABLE IF NOT EXISTS vendor_search USING fts5(id UNINDEXED, name, details);
      CREATE VIRTUAL TABLE IF NOT EXISTS grocery_search USING fts5(id UNINDEXED, title, details);

      DELETE FROM menu_search;
      INSERT INTO menu_search SELECT id, name, COALESCE(description, '') FROM menu_items;
      DELETE FROM order_search;
      INSERT INTO order_search SELECT id, order_number, COALESCE(token_number, '') || ' ' || COALESCE(customer_name, '') || ' ' || COALESCE(phone_number, '') FROM orders;
      DELETE FROM customer_search;
      INSERT INTO customer_search SELECT id, name, COALESCE(phone_number, '') || ' ' || COALESCE(address, '') || ' ' || COALESCE(email, '') FROM customers;
      DELETE FROM vendor_search;
      INSERT INTO vendor_search SELECT id, name, COALESCE(phone, '') || ' ' || COALESCE(address, '') FROM grocery_vendors;
      DELETE FROM grocery_search;
      INSERT INTO grocery_search SELECT id, COALESCE(invoice_number, vendor_name, ''), COALESCE(vendor_name, '') || ' ' || COALESCE(payload, '') FROM grocery_purchases;

      CREATE TRIGGER IF NOT EXISTS menu_search_insert AFTER INSERT ON menu_items BEGIN
        INSERT INTO menu_search VALUES (NEW.id, NEW.name, COALESCE(NEW.description, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS menu_search_update AFTER UPDATE ON menu_items BEGIN
        DELETE FROM menu_search WHERE id = OLD.id;
        INSERT INTO menu_search VALUES (NEW.id, NEW.name, COALESCE(NEW.description, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS menu_search_delete AFTER DELETE ON menu_items BEGIN
        DELETE FROM menu_search WHERE id = OLD.id;
      END;
      CREATE TRIGGER IF NOT EXISTS order_search_insert AFTER INSERT ON orders BEGIN
        INSERT INTO order_search VALUES (NEW.id, NEW.order_number, COALESCE(NEW.token_number, '') || ' ' || COALESCE(NEW.customer_name, '') || ' ' || COALESCE(NEW.phone_number, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS order_search_update AFTER UPDATE ON orders BEGIN
        DELETE FROM order_search WHERE id = OLD.id;
        INSERT INTO order_search VALUES (NEW.id, NEW.order_number, COALESCE(NEW.token_number, '') || ' ' || COALESCE(NEW.customer_name, '') || ' ' || COALESCE(NEW.phone_number, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS order_search_delete AFTER DELETE ON orders BEGIN
        DELETE FROM order_search WHERE id = OLD.id;
      END;
      CREATE TRIGGER IF NOT EXISTS customer_search_insert AFTER INSERT ON customers BEGIN
        INSERT INTO customer_search VALUES (NEW.id, NEW.name, COALESCE(NEW.phone_number, '') || ' ' || COALESCE(NEW.address, '') || ' ' || COALESCE(NEW.email, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS customer_search_update AFTER UPDATE ON customers BEGIN
        DELETE FROM customer_search WHERE id = OLD.id;
        INSERT INTO customer_search VALUES (NEW.id, NEW.name, COALESCE(NEW.phone_number, '') || ' ' || COALESCE(NEW.address, '') || ' ' || COALESCE(NEW.email, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS customer_search_delete AFTER DELETE ON customers BEGIN
        DELETE FROM customer_search WHERE id = OLD.id;
      END;
      CREATE TRIGGER IF NOT EXISTS vendor_search_insert AFTER INSERT ON grocery_vendors BEGIN
        INSERT INTO vendor_search VALUES (NEW.id, NEW.name, COALESCE(NEW.phone, '') || ' ' || COALESCE(NEW.address, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS vendor_search_update AFTER UPDATE ON grocery_vendors BEGIN
        DELETE FROM vendor_search WHERE id = OLD.id;
        INSERT INTO vendor_search VALUES (NEW.id, NEW.name, COALESCE(NEW.phone, '') || ' ' || COALESCE(NEW.address, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS vendor_search_delete AFTER DELETE ON grocery_vendors BEGIN
        DELETE FROM vendor_search WHERE id = OLD.id;
      END;
      CREATE TRIGGER IF NOT EXISTS grocery_search_insert AFTER INSERT ON grocery_purchases BEGIN
        INSERT INTO grocery_search VALUES (NEW.id, COALESCE(NEW.invoice_number, NEW.vendor_name, ''), COALESCE(NEW.vendor_name, '') || ' ' || COALESCE(NEW.payload, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS grocery_search_update AFTER UPDATE ON grocery_purchases BEGIN
        DELETE FROM grocery_search WHERE id = OLD.id;
        INSERT INTO grocery_search VALUES (NEW.id, COALESCE(NEW.invoice_number, NEW.vendor_name, ''), COALESCE(NEW.vendor_name, '') || ' ' || COALESCE(NEW.payload, ''));
      END;
      CREATE TRIGGER IF NOT EXISTS grocery_search_delete AFTER DELETE ON grocery_purchases BEGIN
        DELETE FROM grocery_search WHERE id = OLD.id;
      END;
    `,
  },
  {
    id: 11,
    name: "durable_cloud_snapshot_queue",
    sql: `
      CREATE TABLE IF NOT EXISTS cloud_snapshot_queue (
        id TEXT PRIMARY KEY,
        snapshot_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        local_path TEXT NOT NULL,
        checksum_sha256 TEXT NOT NULL,
        database_checksum TEXT NOT NULL,
        checksum_kind TEXT NOT NULL DEFAULT 'logical_v1',
        sync_sequence INTEGER NOT NULL DEFAULT 0,
        schema_version INTEGER NOT NULL DEFAULT 0,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cloud_snapshot_queue_created
        ON cloud_snapshot_queue(created_at);
    `,
  },
];

export function openRestaurantDatabase(restaurantCode: string): PosDatabase {
  const key = restaurantCode.trim().toUpperCase();
  const existing = databaseConnections.get(key);
  if (existing?.open) return existing;

  const db = new Database(getDatabasePath(key));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = FULL");
  db.pragma("busy_timeout = 5000");
  runMigrations(db);
  if (process.env.RESTROZAPP_SEED_DEMO === "1") {
    seedStarterCatalog(db);
    seedDemoCatalog(db);
  }
  databaseConnections.set(key, db);
  return db;
}

export function closeRestaurantDatabase(restaurantCode: string) {
  const key = restaurantCode.trim().toUpperCase();
  const db = databaseConnections.get(key);
  if (!db) return;
  if (db.open) {
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.close();
  }
  databaseConnections.delete(key);
}

export function forceCloseRestaurantDatabase(restaurantCode: string) {
  const key = restaurantCode.trim().toUpperCase();
  const db = databaseConnections.get(key);
  if (!db) return;
  try {
    if (db.open) db.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    // Recovery must still be able to close and replace a damaged database.
  }
  try {
    if (db.open) db.close();
  } finally {
    databaseConnections.delete(key);
  }
}

export function closeAllRestaurantDatabases() {
  for (const key of [...databaseConnections.keys()]) closeRestaurantDatabase(key);
}

export function runMigrations(db: PosDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set(
    db.prepare("SELECT id FROM schema_migrations").all().map((row: any) => Number(row.id)),
  );

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    const apply = db.transaction(() => {
      if ("raw" in migration && migration.raw) db.exec(migration.sql);
      else runMigrationSql(db, migration.sql);
      db.prepare("INSERT INTO schema_migrations (id, name) VALUES (?, ?)").run(
        migration.id,
        migration.name,
      );
    });
    apply();
  }
}

export function getLatestDatabaseSchemaVersion() {
  return migrations.at(-1)?.id || 0;
}

function runMigrationSql(db: PosDatabase, sql: string) {
  for (const statement of sql.split(";").map((entry) => entry.trim()).filter(Boolean)) {
    try {
      db.exec(`${statement};`);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("duplicate column name")) continue;
      throw error;
    }
  }
}

export function beginDatabaseReplacement(restaurantCode: string) {
  const key = restaurantCode.trim().toUpperCase();
  if (replacementRestaurantCode) {
    throw new Error("Another database recovery operation is already running.");
  }
  replacementRestaurantCode = key;
}

export function endDatabaseReplacement(restaurantCode: string) {
  const key = restaurantCode.trim().toUpperCase();
  if (replacementRestaurantCode === key) replacementRestaurantCode = null;
}

export function withActivatedDatabase<T>(
  restaurantCode: string,
  callback: (db: PosDatabase) => T,
  allowDuringReplacement = false,
): T {
  const key = restaurantCode.trim().toUpperCase();
  if (!allowDuringReplacement && replacementRestaurantCode === key) {
    throw new Error("Database recovery is in progress. Please wait.");
  }
  const db = openRestaurantDatabase(restaurantCode);
  return callback(db);
}

function seedStarterCatalog(db: PosDatabase) {
  const categoryCount = Number(
    (db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number }).count,
  );
  if (categoryCount > 0) return;

  const seed = db.transaction(() => {
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, icon, color, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const insertKitchen = db.prepare(`
      INSERT INTO kitchens (id, name, icon, color, is_active, display_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO menu_items (
        id, category_id, kitchen_id, name, description, cost_price,
        selling_price, preparation_time, is_pinned, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertCategory.run("cat-main", "Main Course", "", "#047857");
    insertCategory.run("cat-bbq", "BBQ", "", "#b45309");
    insertCategory.run("cat-drinks", "Drinks", "", "#0369a1");
    insertCategory.run("cat-sides", "Sides", "", "#7c3aed");

    insertKitchen.run("kit-main", "Main Kitchen", "", "#047857", 1);
    insertKitchen.run("kit-bbq", "BBQ Station", "", "#b45309", 2);
    insertKitchen.run("kit-bar", "Drinks Counter", "", "#0369a1", 3);

    insertItem.run("item-karahi", "cat-main", "kit-main", "Chicken Karahi", "House-style chicken karahi", 0, 1800, "25 min", 1);
    insertItem.run("item-biryani", "cat-main", "kit-main", "Chicken Biryani", "Single serving", 0, 450, "15 min", 1);
    insertItem.run("item-tikka", "cat-bbq", "kit-bbq", "Chicken Tikka", "Charcoal grilled quarter chicken", 0, 550, "20 min", 1);
    insertItem.run("item-kabab", "cat-bbq", "kit-bbq", "Seekh Kabab", "Two pieces", 0, 380, "15 min", 0);
    insertItem.run("item-roti", "cat-sides", "kit-main", "Roti", "Fresh tandoor roti", 0, 30, "5 min", 1);
    insertItem.run("item-raita", "cat-sides", "kit-main", "Raita", "Fresh yogurt raita", 0, 120, "3 min", 0);
    insertItem.run("item-cola", "cat-drinks", "kit-bar", "Soft Drink", "Regular bottle", 0, 120, "1 min", 0);
    insertItem.run("item-water", "cat-drinks", "kit-bar", "Mineral Water", "500 ml bottle", 0, 70, "1 min", 0);
  });
  seed();
}

function seedDemoCatalog(db: PosDatabase) {
  const seed = db.transaction(() => {
    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, icon, color, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const insertKitchen = db.prepare(`
      INSERT OR IGNORE INTO kitchens (id, name, icon, color, is_active, display_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO menu_items (
        id, category_id, kitchen_id, name, description, cost_price,
        selling_price, preparation_time, is_pinned, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertCategory.run("cat-breakfast", "Breakfast", "", "#f59e0b");
    insertCategory.run("cat-fast-food", "Fast Food", "", "#ef4444");
    insertCategory.run("cat-desserts", "Desserts", "", "#ec4899");
    insertCategory.run("cat-tea", "Tea & Coffee", "", "#92400e");

    insertKitchen.run("kit-breakfast", "Breakfast Counter", "", "#f59e0b", 4);
    insertKitchen.run("kit-fryer", "Fryer Station", "", "#ef4444", 5);
    insertKitchen.run("kit-dessert", "Dessert Counter", "", "#ec4899", 6);

    insertItem.run("demo-omelette", "cat-breakfast", "kit-breakfast", "Cheese Omelette", "Two egg omelette with cheese", 0, 250, "8 min", 1);
    insertItem.run("demo-paratha", "cat-breakfast", "kit-breakfast", "Aloo Paratha", "Stuffed paratha with raita", 0, 180, "10 min", 1);
    insertItem.run("demo-zinger", "cat-fast-food", "kit-fryer", "Zinger Burger", "Crispy chicken burger", 0, 480, "12 min", 1);
    insertItem.run("demo-fries", "cat-fast-food", "kit-fryer", "Loaded Fries", "Fries with sauces and cheese", 0, 320, "8 min", 0);
    insertItem.run("demo-kheer", "cat-desserts", "kit-dessert", "Kheer Cup", "Traditional rice pudding", 0, 180, "2 min", 0);
    insertItem.run("demo-tea", "cat-tea", "kit-bar", "Doodh Patti", "Strong milk tea", 0, 90, "5 min", 1);
  });
  seed();
}
