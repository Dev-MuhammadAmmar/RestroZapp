import type { ApiResult, SyncEvent, SyncStatus } from "@restrozapp/shared";
import { SUPABASE_FUNCTIONS_URL } from "@restrozapp/shared";
import { withActivatedDatabase } from "../database/database";
import { readActivationState, readDeviceToken } from "./stateStore";
import { rebuildNormalizedGroceryTables } from "./groceryService";

const SYNC_BATCH_SIZE = 250;
const REQUEST_TIMEOUT_MS = 8_000;
let activeSync: Promise<ApiResult<SyncStatus>> | null = null;

const allowedEntities = new Set([
  "categories",
  "kitchens",
  "menu_items",
  "orders",
  "order_items",
  "customers",
  "local_settings",
  "grocery_store",
]);

function credentials() {
  const state = readActivationState();
  const token = readDeviceToken();
  if (state.status !== "approved" || !state.restaurant || !state.deviceId || !token) {
    throw new Error("POS is not securely activated.");
  }
  return { state, token, code: state.restaurant.restaurantCode };
}

async function postJson(path: string, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `${path} failed`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function pendingSyncEvents(limit = SYNC_BATCH_SIZE): SyncEvent[] {
  const { code } = credentials();
  return withActivatedDatabase(code, (db) =>
    db.prepare(`
      SELECT event_id, entity, entity_id, operation, payload, occurred_at
      FROM sync_outbox
      WHERE status = 'pending'
      ORDER BY occurred_at ASC
      LIMIT ?
    `).all(limit).map((row: any) => ({
      eventId: row.event_id,
      entity: row.entity,
      entityId: row.entity_id,
      operation: row.operation,
      payload: row.payload ? JSON.parse(row.payload) : null,
      occurredAt: row.occurred_at,
    })),
  );
}

async function performSync(): Promise<ApiResult<SyncStatus>> {
  try {
    const { state, token, code } = credentials();
    const events = pendingSyncEvents();
    const result = await postJson("sync-push", {
      restaurantCode: code,
      deviceId: state.deviceId,
      deviceToken: token,
      events,
    });
    withActivatedDatabase(code, (db) => {
      const mark = db.prepare("UPDATE sync_outbox SET status = 'synced', error = NULL WHERE event_id = ?");
      const setState = db.prepare(`
        INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `);
      db.transaction(() => {
        for (const id of result.acceptedEventIds || []) mark.run(id);
        setState.run("last_cloud_sequence", String(result.sequence || 0), new Date().toISOString());
        setState.run("last_successful_sync", new Date().toISOString(), new Date().toISOString());
        db.prepare(`
          DELETE FROM sync_outbox
          WHERE status = 'synced'
            AND datetime(occurred_at) < datetime('now', '-30 days')
        `).run();
      })();
    });
    return { ok: true, data: getSyncStatus() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sync failed." };
  }
}

export function syncNow(): Promise<ApiResult<SyncStatus>> {
  if (activeSync) return activeSync;
  activeSync = performSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

export function getSyncStatus(): SyncStatus {
  try {
    const { state, code } = credentials();
    return withActivatedDatabase(code, (db) => {
      const pending = db.prepare("SELECT COUNT(*) AS count FROM sync_outbox WHERE status = 'pending'").get() as { count: number };
      const pendingSnapshots = db.prepare("SELECT COUNT(*) AS count FROM cloud_snapshot_queue").get() as { count: number };
      const values = Object.fromEntries(
        (db.prepare("SELECT key, value FROM sync_state").all() as Array<{ key: string; value: string }>)
          .map((row) => [row.key, row.value]),
      );
      return {
        online: true,
        pendingEvents: Number(pending.count),
        pendingSnapshots: Number(pendingSnapshots.count),
        lastSuccessfulSync: values.last_successful_sync,
        lastCloudSequence: Number(values.last_cloud_sequence || 0),
        nextSnapshotAt: values.next_snapshot_at,
        recoveryReady: true,
      };
    });
  } catch (error) {
    return {
      online: false,
      pendingEvents: 0,
      pendingSnapshots: 0,
      lastCloudSequence: 0,
      recoveryReady: false,
      error: error instanceof Error ? error.message : "Sync unavailable.",
    };
  }
}

export async function pullEventsAfter(sequence: number, allowDuringReplacement = false) {
  const { state, token, code } = credentials();
  let cursor = sequence;
  let hasMore = true;
  while (hasMore) {
    const result = await postJson("sync-pull", {
      restaurantCode: code,
      deviceId: state.deviceId,
      deviceToken: token,
      afterSequence: cursor,
    });
    applyCloudEvents(code, result.events || [], allowDuringReplacement);
    cursor = Number(result.sequence || cursor);
    hasMore = Boolean(result.hasMore);
  }
  withActivatedDatabase(code, (db) => {
    db.prepare(`
      INSERT INTO sync_state (key, value, updated_at) VALUES ('last_cloud_sequence', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(String(cursor), new Date().toISOString());
  }, allowDuringReplacement);
  return cursor;
}

function applyCloudEvents(code: string, events: any[], allowDuringReplacement: boolean) {
  withActivatedDatabase(code, (db) => {
    const setState = db.prepare(`
      INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    db.transaction(() => {
      setState.run("suppress_outbox", "1", new Date().toISOString());
      let groceryChanged = false;
      try {
        for (const event of events) {
          if (!allowedEntities.has(event.entity)) continue;
          const primaryKey = event.entity === "local_settings" ? "key" : "id";
          if (event.operation === "delete") {
            db.prepare(`DELETE FROM ${event.entity} WHERE ${primaryKey} = ?`).run(event.entity_id);
            if (event.entity === "grocery_store") groceryChanged = true;
            continue;
          }
          const payload = event.payload || {};
          payload[primaryKey] = event.entity_id;
          const keys = Object.keys(payload).filter((key) => /^[a-z_]+$/.test(key));
          if (!keys.length) continue;
          const columns = keys.join(", ");
          const placeholders = keys.map(() => "?").join(", ");
          const updates = keys.filter((key) => key !== primaryKey).map((key) => `${key}=excluded.${key}`).join(", ");
          const conflictClause = updates
            ? `ON CONFLICT(${primaryKey}) DO UPDATE SET ${updates}`
            : `ON CONFLICT(${primaryKey}) DO NOTHING`;
          db.prepare(`
            INSERT INTO ${event.entity} (${columns}) VALUES (${placeholders})
            ${conflictClause}
          `).run(...keys.map((key) => payload[key]));
          if (event.entity === "grocery_store") groceryChanged = true;
        }
        if (groceryChanged) rebuildNormalizedGroceryTables(db);
      } finally {
        setState.run("suppress_outbox", "0", new Date().toISOString());
      }
    })();
  }, allowDuringReplacement);
}
