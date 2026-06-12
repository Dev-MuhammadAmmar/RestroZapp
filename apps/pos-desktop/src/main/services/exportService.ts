import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BrowserWindow } from "electron";
import type { CsvExportKind, ReportExportInput } from "@restrozapp/shared";
import { getDesktopExportDir, getRestaurantBrandingDir } from "../config/paths";
import { withActivatedDatabase, type PosDatabase } from "../database/database";
import { readActivationState } from "./stateStore";
import { getPosSettings } from "./posService";

function activeRestaurantCode() {
  const state = readActivationState();
  if (state.status !== "approved" || !state.restaurant?.restaurantCode) {
    throw new Error("This device is not activated.");
  }
  return state.restaurant.restaurantCode;
}

function csvCell(value: unknown) {
  let text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(kind: CsvExportKind, headers: string[], rows: unknown[][]) {
  const code = activeRestaurantCode();
  const directory = getDesktopExportDir(code, "CSV");
  const filePath = path.join(directory, `${kind}-${new Date().toISOString().slice(0, 10)}-${Date.now()}.csv`);
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  fs.writeFileSync(filePath, `\uFEFF${content}`, "utf8");
  return filePath;
}

export function exportCsv(kind: CsvExportKind) {
  try {
    const code = activeRestaurantCode();
    const filePath = withActivatedDatabase(code, (db) => {
      if (kind === "orders") {
        const rows = db.prepare(`
          SELECT order_number, token_number, customer_name, phone_number, order_type,
                 table_number, total, payment_method, status, created_at
          FROM orders ORDER BY created_at DESC
        `).all() as any[];
        return writeCsv(kind,
          ["Order Number", "Token", "Customer", "Phone", "Type", "Table", "Total", "Payment", "Status", "Created At"],
          rows.map((row) => [
            row.order_number, row.token_number, row.customer_name, row.phone_number,
            row.order_type, row.table_number, row.total, row.payment_method, row.status, row.created_at,
          ]),
        );
      }
      if (kind === "customers") {
        const rows = db.prepare(`
          SELECT name, phone_number, address, email, order_count, total_spent, last_order_date
          FROM customers WHERE is_active = 1 ORDER BY name
        `).all() as any[];
        return writeCsv(kind,
          ["Name", "Phone", "Address", "Email", "Orders", "Total Spent", "Last Order"],
          rows.map((row) => [
            row.name, row.phone_number, row.address, row.email,
            row.order_count, row.total_spent, row.last_order_date,
          ]),
        );
      }
      const rows = db.prepare(`
        SELECT mi.name, c.name AS category, k.name AS kitchen, mi.selling_price,
               mi.preparation_time, mi.is_active
        FROM menu_items mi
        LEFT JOIN categories c ON c.id = mi.category_id
        LEFT JOIN kitchens k ON k.id = mi.kitchen_id
        ORDER BY mi.name
      `).all() as any[];
      return writeCsv(kind,
        ["Item", "Category", "Kitchen", "Selling Price", "Preparation Time", "Status"],
        rows.map((row) => [
          row.name, row.category, row.kitchen, row.selling_price,
          row.preparation_time, row.is_active ? "Active" : "Inactive",
        ]),
      );
    });
    return { ok: true as const, data: { path: filePath } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "CSV export failed." };
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function reportLogoSource(restaurantCode: string, logoUrl: string) {
  if (!logoUrl) return "";
  if (!logoUrl.startsWith("restrozapp-media://branding/")) return logoUrl;

  try {
    const fileName = path.basename(decodeURIComponent(new URL(logoUrl).pathname));
    if (!/^[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/i.test(fileName)) return "";
    const filePath = path.join(getRestaurantBrandingDir(restaurantCode), fileName);
    if (!fs.existsSync(filePath)) return "";
    const extension = path.extname(fileName).toLowerCase();
    const mimeType = extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg";
    return `data:${mimeType};base64,${fs.readFileSync(filePath).toString("base64")}`;
  } catch {
    return "";
  }
}

function reportData(db: PosDatabase, input: ReportExportInput) {
  const clauses = ["status = 'completed'"];
  const values: string[] = [];
  if (input.startDate) {
    clauses.push("date(created_at, 'localtime') >= date(?)");
    values.push(input.startDate);
  }
  if (input.endDate) {
    clauses.push("date(created_at, 'localtime') <= date(?)");
    values.push(input.endDate);
  }
  const where = `WHERE ${clauses.join(" AND ")}`;
  const orders = db.prepare(`
    SELECT id, order_number, customer_name, order_type, payment_method, total, created_at
    FROM orders ${where} ORDER BY created_at DESC LIMIT 10000
  `).all(...values) as any[];
  const totals = orders.reduce((summary, order) => {
    summary.revenue += Number(order.total || 0);
    summary.orders += 1;
    return summary;
  }, { revenue: 0, orders: 0 });
  const byDay = new Map<string, number>();
  for (const order of orders) {
    const day = String(order.created_at).slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + Number(order.total || 0));
  }
  const topItems = db.prepare(`
    SELECT oi.name, SUM(oi.quantity) AS quantity, SUM(oi.price * oi.quantity) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    ${where.replaceAll("created_at", "o.created_at")}
    GROUP BY oi.name ORDER BY quantity DESC LIMIT 12
  `).all(...values) as any[];
  return { orders, totals, byDay: [...byDay.entries()].sort(), topItems };
}

function reportHtml(input: ReportExportInput) {
  const code = activeRestaurantCode();
  const settingsResult = getPosSettings();
  if (!settingsResult.ok) throw new Error(settingsResult.error);
  const settings = settingsResult.data;
  const data = withActivatedDatabase(code, (db) => reportData(db, input));
  const maxDaily = Math.max(1, ...data.byDay.map(([, value]) => value));
  const period = input.startDate || input.endDate
    ? `${input.startDate || "Beginning"} to ${input.endDate || "Today"}`
    : "All completed orders";
  const logoSource = reportLogoSource(code, settings.restaurantLogo);
  const logo = logoSource
    ? `<img class="logo" src="${escapeHtml(logoSource)}" alt="">`
    : "";
  const chart = data.byDay.slice(-31).map(([day, value]) => `
    <div class="bar-cell"><div class="bar" style="height:${Math.max(4, Math.round((value / maxDaily) * 110))}px"></div><span>${escapeHtml(day.slice(5))}</span></div>
  `).join("");
  const orderRows = data.orders.slice(0, 250).map((order) => `
    <tr><td>${escapeHtml(order.order_number)}</td><td>${escapeHtml(order.customer_name || "Guest")}</td>
    <td>${escapeHtml(order.order_type)}</td><td>${escapeHtml(order.payment_method)}</td>
    <td class="number">Rs ${Number(order.total).toFixed(2)}</td><td>${escapeHtml(new Date(order.created_at).toLocaleString())}</td></tr>
  `).join("");
  const itemRows = data.topItems.map((item) => `
    <tr><td>${escapeHtml(item.name)}</td><td class="number">${item.quantity}</td><td class="number">Rs ${Number(item.revenue).toFixed(2)}</td></tr>
  `).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:13mm}*{box-sizing:border-box}body{margin:0;font:11px Arial,sans-serif;color:#172033}
    header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #f36b2b;padding-bottom:12px}
    .brand{display:flex;align-items:center;gap:12px}.logo{width:58px;height:58px;object-fit:contain}.brand h1{margin:0;font-size:23px}.brand p{margin:4px 0 0;color:#64748b}
    .meta{text-align:right;color:#64748b}.meta b{display:block;color:#172033;font-size:13px}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.metric{border:1px solid #dbe1ea;padding:12px}.metric span{color:#64748b}.metric b{display:block;margin-top:6px;font-size:18px;color:#ea5b20}
    h2{font-size:14px;margin:20px 0 8px}.chart{height:145px;border:1px solid #dbe1ea;padding:12px;display:flex;align-items:flex-end;gap:5px;overflow:hidden}.bar-cell{min-width:18px;flex:1;text-align:center}.bar{width:100%;background:#f36b2b}.bar-cell span{display:block;font-size:7px;color:#64748b;margin-top:4px;transform:rotate(-45deg)}
    table{width:100%;border-collapse:collapse;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid}th,td{padding:7px;border-bottom:1px solid #e5e9f0;text-align:left}th{background:#172033;color:white}.number{text-align:right}
    footer{margin-top:18px;border-top:1px solid #dbe1ea;padding-top:8px;text-align:center;color:#64748b}
  </style></head><body>
    <header><div class="brand">${logo}<div><h1>${escapeHtml(settings.restaurantName)}</h1><p>${escapeHtml(settings.address)}</p></div></div>
    <div class="meta"><b>${escapeHtml(input.title || "Business Report")}</b>${escapeHtml(period)}<br>Generated ${escapeHtml(new Date().toLocaleString())}</div></header>
    <section class="metrics"><div class="metric"><span>Total revenue</span><b>Rs ${data.totals.revenue.toFixed(2)}</b></div>
    <div class="metric"><span>Completed orders</span><b>${data.totals.orders}</b></div>
    <div class="metric"><span>Average order</span><b>Rs ${(data.totals.orders ? data.totals.revenue / data.totals.orders : 0).toFixed(2)}</b></div>
    <div class="metric"><span>Items tracked</span><b>${data.topItems.length}</b></div></section>
    <h2>Revenue trend</h2><div class="chart">${chart || "<p>No completed orders in this period.</p>"}</div>
    <h2>Top selling items</h2><table><thead><tr><th>Item</th><th class="number">Quantity</th><th class="number">Revenue</th></tr></thead><tbody>${itemRows || "<tr><td colspan='3'>No item data.</td></tr>"}</tbody></table>
    <h2>Completed order details</h2><table><thead><tr><th>Order</th><th>Customer</th><th>Type</th><th>Payment</th><th class="number">Total</th><th>Date</th></tr></thead><tbody>${orderRows || "<tr><td colspan='6'>No completed orders.</td></tr>"}</tbody></table>
    <footer>Powered by RestroZapp - restrozapp.vercel.app</footer>
  </body></html>`;
}

export async function exportReportPdf(input: ReportExportInput) {
  let window: BrowserWindow | null = null;
  let temporaryHtmlPath = "";
  try {
    if (!input || typeof input.title !== "string" || input.title.length > 100) {
      throw new Error("Invalid report request.");
    }
    const code = activeRestaurantCode();
    window = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    temporaryHtmlPath = path.join(
      os.tmpdir(),
      `restrozapp-report-${process.pid}-${Date.now()}.html`,
    );
    fs.writeFileSync(temporaryHtmlPath, reportHtml(input), "utf8");
    await window.loadFile(temporaryHtmlPath);
    await window.webContents.executeJavaScript(`
      Promise.all([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        ...Array.from(document.images).map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
              })
        )
      ])
    `);
    const bytes = await window.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
    });
    if (bytes.length < 5 || bytes.subarray(0, 4).toString("ascii") !== "%PDF") {
      throw new Error("Chromium did not create a valid PDF.");
    }
    const filePath = path.join(
      getDesktopExportDir(code, "PDF"),
      `report-${new Date().toISOString().slice(0, 10)}-${Date.now()}.pdf`,
    );
    fs.writeFileSync(filePath, bytes);
    return { ok: true as const, data: { path: filePath } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "PDF export failed." };
  } finally {
    window?.destroy();
    if (temporaryHtmlPath) {
      try {
        fs.rmSync(temporaryHtmlPath, { force: true });
      } catch {
        // Temporary report cleanup must not hide an otherwise successful export.
      }
    }
  }
}
