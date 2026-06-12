import { BrowserWindow } from "electron";
import type {
  HtmlPrintEnqueueRequest,
  PrintJob,
  PrintQueueStatus,
  PosOrder,
  RestaurantConfig,
} from "@restrozapp/shared";
import { randomUUID } from "node:crypto";
import { withActivatedDatabase } from "../database/database";
import { readActivationState } from "./stateStore";

type StoredJob = {
  id: string;
  receipt_type: "kot" | "token" | "bill" | "document";
  status: PrintJob["status"];
  order_id: string;
  kitchen_id: string | null;
  kitchen_name: string;
  payload: string;
  printer_name: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string | null;
  created_at: string;
  printed_at: string | null;
  error: string | null;
};

let printWindow: BrowserWindow | null = null;
let workerTimer: NodeJS.Timeout | null = null;
let processing = false;
let notify: (() => void) | null = null;

function restaurantCode() {
  const state = readActivationState();
  if (state.status !== "approved" || !state.restaurant?.restaurantCode) return null;
  return state.restaurant.restaurantCode;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function receiptHtml(job: StoredJob) {
  if (job.receipt_type === "document") {
    const payload = JSON.parse(job.payload) as { html?: string };
    if (!payload.html) throw new Error("Document print payload is empty.");
    return payload.html;
  }
  const payload = JSON.parse(job.payload) as {
    order: PosOrder;
    restaurant?: RestaurantConfig;
    kitchenName?: string;
    receiptWidth?: string;
  };
  const { order, restaurant } = payload;
  const width = payload.receiptWidth === "58mm" ? "58mm" : payload.receiptWidth === "80mm" ? "80mm" : "66mm";
  const items = order.items.map((item) => `
    <tr><td>${escapeHtml(item.name)}</td><td class="right">${item.quantity}</td>
    ${job.receipt_type === "bill" ? `<td class="right">${item.price.toFixed(0)}</td><td class="right">${item.lineTotal.toFixed(0)}</td>` : ""}</tr>
  `).join("");
  const header = `
    ${job.receipt_type !== "kot" && restaurant?.logoUrl ? `<img class="logo" src="${escapeHtml(restaurant.logoUrl)}" alt="">` : ""}
    <h1>${escapeHtml(job.receipt_type === "kot" ? "KOT" : restaurant?.restaurantName || "RestroZapp")}</h1>
    ${job.receipt_type === "kot" ? `<b>KITCHEN ORDER TICKET</b>${payload.kitchenName ? `<h2>${escapeHtml(payload.kitchenName)}</h2>` : ""}` : ""}
    ${job.receipt_type !== "kot" && restaurant?.address ? `<div>${escapeHtml(restaurant.address)}</div>` : ""}
    ${job.receipt_type !== "kot" && restaurant?.phone1 ? `<div>${escapeHtml(restaurant.phone1)}</div>` : ""}
  `;
  const totals = job.receipt_type === "bill" ? `
    <div class="line"><span>Subtotal</span><span>Rs ${order.subtotal.toFixed(2)}</span></div>
    ${order.tax > 0 ? `<div class="line"><span>Tax</span><span>Rs ${order.tax.toFixed(2)}</span></div>` : ""}
    ${order.deliveryCharge > 0 ? `<div class="line"><span>Delivery</span><span>Rs ${order.deliveryCharge.toFixed(2)}</span></div>` : ""}
    ${order.discountAmount > 0 ? `<div class="line"><span>Discount</span><span>- Rs ${order.discountAmount.toFixed(2)}</span></div>` : ""}
    <div class="total"><span>TOTAL</span><b>Rs ${order.total.toFixed(2)}</b></div>
  ` : "";
  const token = job.receipt_type === "token" ? `
    <div class="token"><span>Token Number</span><b>${escapeHtml(order.tokenNumber)}</b></div>
    <div class="center">Your order is being prepared.</div>
  ` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:${width} auto;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#000}
    .receipt{width:${width};padding:3mm;font-size:12px}.center{text-align:center}.head{text-align:center;border-bottom:2px dashed #000;padding-bottom:8px}
    .logo{display:block;width:18mm;height:18mm;object-fit:contain;margin:0 auto 2mm}
    h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:5px 0}.line{display:flex;justify-content:space-between;padding:4px 0}
    table{width:100%;border-collapse:collapse;margin:8px 0}th,td{text-align:left;padding:4px 1px;border-bottom:1px dashed #000}.right{text-align:right}
    .total{display:flex;justify-content:space-between;border-top:2px solid #000;border-bottom:2px solid #000;padding:7px 0;font-size:16px}
    .token{text-align:center;border:3px solid #000;margin:10px 0;padding:8px}.token span{display:block}.token b{display:block;font-size:42px}
    .footer{text-align:center;margin-top:10px}.notes{border:1px solid #000;padding:5px;margin-top:7px}
  </style></head><body><div class="receipt"><div class="head">${header}</div>
    <div class="line"><b>Order</b><b>${escapeHtml(order.orderNumber)}</b></div>
    <div class="line"><span>Token</span><b>${escapeHtml(order.tokenNumber)}</b></div>
    <div class="line"><span>Type</span><b>${escapeHtml(order.orderType.toUpperCase())}</b></div>
    ${order.tableNumber ? `<div class="line"><span>Table</span><b>${escapeHtml(order.tableNumber)}</b></div>` : ""}
    ${token}
    ${job.receipt_type !== "token" ? `<table><thead><tr><th>Item</th><th class="right">Qty</th>${job.receipt_type === "bill" ? "<th class='right'>Price</th><th class='right'>Total</th>" : ""}</tr></thead><tbody>${items}</tbody></table>` : ""}
    ${order.notes ? `<div class="notes"><b>Notes:</b> ${escapeHtml(order.notes)}</div>` : ""}
    ${totals}<div class="footer">${job.receipt_type === "bill" ? escapeHtml(restaurant?.receiptFooter || "Thank You for Dining with Us!") : escapeHtml(new Date(order.createdAt).toLocaleString())}</div>
    ${job.receipt_type !== "kot" ? `<div class="footer">Powered by RestroZapp<br>restrozapp.vercel.app</div>` : ""}
  </div></body></html>`;
}

export function enqueueHtmlPrint(input: HtmlPrintEnqueueRequest) {
  try {
    if (!input || typeof input.title !== "string" || input.title.length > 120) {
      throw new Error("Invalid document title.");
    }
    if (typeof input.html !== "string" || input.html.length < 20 || input.html.length > 1_500_000) {
      throw new Error("Invalid document content.");
    }
    if (input.html.includes("<script") || input.html.includes("javascript:")) {
      throw new Error("Scripts are not allowed in print documents.");
    }
    const code = restaurantCode();
    if (!code) throw new Error("POS is not activated.");
    withActivatedDatabase(code, (db) => {
      const now = new Date().toISOString();
      const configuredPrinter = db.prepare("SELECT value FROM local_settings WHERE key = 'printerName'").get() as { value?: string } | undefined;
      db.prepare(`
        INSERT INTO print_jobs (
          id, receipt_type, status, created_at, error, order_id, kitchen_id,
          kitchen_name, payload, printer_name, attempts, max_attempts,
          next_attempt_at, updated_at
        ) VALUES (?, 'document', 'queued', ?, NULL, ?, NULL, '', ?, ?, 0, 10, ?, ?)
      `).run(
        randomUUID(),
        now,
        `document:${input.title}`,
        JSON.stringify({ html: input.html, title: input.title }),
        input.printerName || configuredPrinter?.value || "",
        now,
        now,
      );
    });
    signalChange();
    return { ok: true as const, data: { queued: true as const } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to queue document." };
  }
}

function mapJob(row: StoredJob): PrintJob {
  return {
    id: row.id, orderId: row.order_id, receiptType: row.receipt_type,
    kitchenId: row.kitchen_id, kitchenName: row.kitchen_name, printerName: row.printer_name,
    status: row.status, attempts: row.attempts, maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at, createdAt: row.created_at,
    printedAt: row.printed_at, error: row.error,
  };
}

export function getPrintQueueStatus(): PrintQueueStatus {
  const code = restaurantCode();
  if (!code) return { queued: 0, printing: 0, failed: 0, recentJobs: [] };
  return withActivatedDatabase(code, (db) => {
    const counts = db.prepare("SELECT status, COUNT(*) count FROM print_jobs GROUP BY status").all() as Array<{ status: string; count: number }>;
    const count = (status: string) => counts.find((row) => row.status === status)?.count || 0;
    const jobs = db.prepare("SELECT * FROM print_jobs ORDER BY created_at DESC LIMIT 12").all() as StoredJob[];
    return { queued: count("queued"), printing: count("printing"), failed: count("failed"), recentJobs: jobs.map(mapJob) };
  });
}

function signalChange() {
  notify?.();
}

function ensureWindow() {
  if (printWindow && !printWindow.isDestroyed()) return printWindow;
  printWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  return printWindow;
}

function print(win: BrowserWindow, job: StoredJob) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Printer did not respond within 15 seconds."));
    }, 15_000);
    win.webContents.print(
      { silent: true, printBackground: true, deviceName: job.printer_name || undefined, margins: { marginType: "none" } },
      (success, reason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        success ? resolve() : reject(new Error(reason || "Printer rejected the job."));
      },
    );
  });
}

function retryDelay(attempts: number) {
  if (attempts <= 1) return 2_000;
  if (attempts === 2) return 10_000;
  if (attempts === 3) return 30_000;
  return 120_000;
}

async function processNext() {
  if (processing) return;
  const code = restaurantCode();
  if (!code) return;
  const job = withActivatedDatabase(code, (db) => {
    db.prepare("UPDATE print_jobs SET status='queued', updated_at=? WHERE status='printing'").run(new Date().toISOString());
    return db.prepare(`
      SELECT * FROM print_jobs
      WHERE status IN ('queued','failed') AND attempts < max_attempts
        AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
      ORDER BY created_at LIMIT 1
    `).get(new Date().toISOString()) as StoredJob | undefined;
  });
  if (!job) return;
  processing = true;
  try {
    withActivatedDatabase(code, (db) => db.prepare(
      "UPDATE print_jobs SET status='printing', started_at=?, updated_at=?, error=NULL WHERE id=?",
    ).run(new Date().toISOString(), new Date().toISOString(), job.id));
    signalChange();
    const win = ensureWindow();
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml(job))}`);
    await print(win, job);
    withActivatedDatabase(code, (db) => db.prepare(
      "UPDATE print_jobs SET status='printed', attempts=attempts+1, printed_at=?, updated_at=?, next_attempt_at=NULL, error=NULL WHERE id=?",
    ).run(new Date().toISOString(), new Date().toISOString(), job.id));
  } catch (error) {
    const attempts = job.attempts + 1;
    const status = attempts >= job.max_attempts ? "failed" : "queued";
    withActivatedDatabase(code, (db) => db.prepare(`
      UPDATE print_jobs SET status=?, attempts=?, next_attempt_at=?, error=?, updated_at=? WHERE id=?
    `).run(
      status, attempts,
      attempts >= job.max_attempts ? null : new Date(Date.now() + retryDelay(attempts)).toISOString(),
      error instanceof Error ? error.message : "Print failed",
      new Date().toISOString(), job.id,
    ));
  } finally {
    processing = false;
    signalChange();
    setImmediate(() => void processNext());
  }
}

export function retryPrintJob(jobId: string) {
  const code = restaurantCode();
  if (!code) return { ok: false as const, error: "This device is not activated." };
  withActivatedDatabase(code, (db) => db.prepare(
    "UPDATE print_jobs SET status='queued', attempts=0, next_attempt_at=?, error=NULL, updated_at=? WHERE id=?",
  ).run(new Date().toISOString(), new Date().toISOString(), jobId));
  void processNext();
  signalChange();
  return { ok: true as const, data: getPrintQueueStatus() };
}

export function retryAllFailedPrintJobs() {
  const code = restaurantCode();
  if (!code) return { ok: false as const, error: "This device is not activated." };
  withActivatedDatabase(code, (db) => db.prepare(
    "UPDATE print_jobs SET status='queued', attempts=0, next_attempt_at=?, error=NULL, updated_at=? WHERE status='failed'",
  ).run(new Date().toISOString(), new Date().toISOString()));
  void processNext();
  signalChange();
  return { ok: true as const, data: getPrintQueueStatus() };
}

export function wakePrintWorker() {
  void processNext();
}

export function startPrintWorker(onChange: () => void) {
  notify = onChange;
  if (!workerTimer) workerTimer = setInterval(() => void processNext(), 1_000);
  void processNext();
}

export function stopPrintWorker() {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
  printWindow?.destroy();
  printWindow = null;
}
