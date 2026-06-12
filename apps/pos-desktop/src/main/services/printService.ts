import fs from "node:fs";
import path from "node:path";
import type { BrowserWindow } from "electron";
import type { PrinterInfo } from "@restrozapp/shared";
import { getPdfDir } from "../config/paths";
import { readActivationState } from "./stateStore";
import { getPosSettings } from "./posService";

function selectedPrinter() {
  const settings = getPosSettings();
  return settings.ok ? settings.data.printerName : "";
}

function quickPrintEnabled() {
  const settings = getPosSettings();
  return settings.ok ? settings.data.quickPrintEnabled : true;
}

export async function quickPrint(win: BrowserWindow | null) {
  if (!win) return { ok: false as const, error: "No active POS window." };

  return new Promise<{ ok: true; data: { printed: true } } | { ok: false; error: string }>((resolve) => {
    const deviceName = selectedPrinter();
    win.webContents.print({ silent: quickPrintEnabled(), printBackground: true, deviceName: deviceName || undefined }, (success, failureReason) => {
      if (!success) resolve({ ok: false, error: failureReason || "Print failed" });
      else resolve({ ok: true, data: { printed: true } });
    });
  });
}

export async function listPrinters(win: BrowserWindow | null) {
  if (!win) return { ok: false as const, error: "No active POS window." };
  try {
    const printers = await win.webContents.getPrintersAsync();
    const data: PrinterInfo[] = printers.map((printer) => {
      const options = printer.options as Record<string, string | boolean | number | undefined>;
      return {
        name: printer.name,
        displayName: printer.displayName || printer.name,
        isDefault: Boolean(options.isDefault || options["printer-is-default"]),
        status: Number(options.status || 0),
      };
    });
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to list printers." };
  }
}

export async function testPrint(win: BrowserWindow | null, printerName?: string) {
  if (!win) return { ok: false as const, error: "No active POS window." };
  return new Promise<{ ok: true; data: { printed: true } } | { ok: false; error: string }>((resolve) => {
    win.webContents.print(
      { silent: true, printBackground: true, deviceName: printerName || selectedPrinter() || undefined },
      (success, failureReason) => {
        if (!success) resolve({ ok: false, error: failureReason || "Test print failed." });
        else resolve({ ok: true, data: { printed: true } });
      },
    );
  });
}

export async function savePdf(win: BrowserWindow | null) {
  if (!win) return { ok: false as const, error: "No active POS window." };
  const restaurantCode = readActivationState().restaurant?.restaurantCode;
  const pdfDir = getPdfDir(restaurantCode);
  const pdfPath = path.join(pdfDir, `receipt-${Date.now()}.pdf`);
  const data = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: { width: 66000, height: 200000 },
    margins: { marginType: "none" },
  });
  fs.writeFileSync(pdfPath, data);
  return { ok: true as const, data: { path: pdfPath } };
}
