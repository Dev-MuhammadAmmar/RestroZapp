import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  Building2,
  Check,
  Cloud,
  CreditCard,
  Database,
  Download,
  HardDrive,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  LockKeyhole,
  MonitorCog,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
} from "lucide-react";
import type {
  AppVersion,
  BackupLog,
  CloudSnapshot,
  PosSettingKey,
  PosSettings,
  PrinterInfo,
  SystemStatus,
} from "@restrozapp/shared";

type Tab = "restaurant" | "billing" | "printing" | "backup" | "system" | "security";

const tabs = [
  { id: "restaurant" as const, label: "Restaurant", icon: Building2 },
  { id: "billing" as const, label: "Billing", icon: CreditCard },
  { id: "printing" as const, label: "Printing", icon: Printer },
  { id: "backup" as const, label: "Backup & Data", icon: Database },
  { id: "system" as const, label: "System", icon: MonitorCog },
  { id: "security" as const, label: "Security", icon: ShieldCheck },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("restaurant");
  const [saved, setSaved] = useState<PosSettings | null>(null);
  const [form, setForm] = useState<PosSettings | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [cloudSnapshots, setCloudSnapshots] = useState<CloudSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState("");
  const [showAdvancedRecovery, setShowAdvancedRecovery] = useState(false);
  const [update, setUpdate] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pendingLogoData, setPendingLogoData] = useState<string | null | undefined>(undefined);

  function loadSettings() {
    return window.restrozapp.pos.getSettings().then((settingsResult) => {
      if (settingsResult.ok) {
        setSaved(settingsResult.data);
        setForm(settingsResult.data);
      } else {
        notify(settingsResult.error, true);
      }
    });
  }

  useEffect(() => {
    Promise.all([
      window.restrozapp.pos.getSettings(),
      window.restrozapp.system.status(),
      window.restrozapp.print.listPrinters(),
      window.restrozapp.backup.listLogs(),
      window.restrozapp.backup.listCloud(),
    ]).then(([settingsResult, systemResult, printerResult, backupResult, cloudResult]) => {
      if (settingsResult.ok) {
        setSaved(settingsResult.data);
        setForm(settingsResult.data);
      } else {
        notify(settingsResult.error, true);
      }
      setSystem(systemResult);
      if (printerResult.ok) setPrinters(printerResult.data);
      if (backupResult.ok) setBackups(backupResult.data);
      if (cloudResult.ok) {
        setCloudSnapshots(cloudResult.data);
        setSelectedSnapshot(cloudResult.data[0]?.id || "");
      }
      setLoading(false);
    });
    const refresh = () => void loadSettings();
    document.addEventListener("restrozapp-settings-changed", refresh);
    return () => document.removeEventListener("restrozapp-settings-changed", refresh);
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(form), [saved, form]);
  const locked = (key: PosSettingKey) => Boolean(form?.lockedKeys.includes(key));

  function notify(text: string, error = false) {
    setMessage({ text, error });
    window.setTimeout(() => setMessage(null), 3500);
  }

  function updateField<K extends keyof PosSettings>(key: K, value: PosSettings[K]) {
    if (locked(key as PosSettingKey)) return;
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  async function save() {
    if (!form || !password) {
      setShowPassword(true);
      return;
    }
    setWorking("save");
    const { lockedKeys: _lockedKeys, ...allValues } = form;
    const values = Object.fromEntries(
      Object.entries(allValues).filter(([key, value]) =>
        key !== "restaurantLogo" &&
        !form.lockedKeys.includes(key as PosSettingKey) &&
        value !== saved?.[key as keyof PosSettings]
      ),
    );
    let result = await window.restrozapp.pos.updateSettings({ values, password });
    if (result.ok && pendingLogoData !== undefined) {
      result = await window.restrozapp.pos.saveRestaurantLogo({
        dataUrl: pendingLogoData,
        password,
      });
    }
    setWorking("");
    if (!result.ok) return notify(result.error, true);
    setSaved(result.data);
    setForm(result.data);
    setPendingLogoData(undefined);
    setPassword("");
    setShowPassword(false);
    notify("Settings saved successfully.");
  }

  async function chooseLogo(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return notify("Logo must be a PNG, JPEG, or WebP image.", true);
    }
    if (file.size > 2_000_000) return notify("Logo must be smaller than 2 MB.", true);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read logo."));
      reader.readAsDataURL(file);
    });
    setPendingLogoData(dataUrl);
    updateField("restaurantLogo", dataUrl);
  }

  async function createBackup() {
    setWorking("backup");
    const result = await window.restrozapp.backup.createNow("manual");
    setWorking("");
    if (!result.ok) return notify(result.error, true);
    const fresh = await window.restrozapp.backup.listCloud();
    if (fresh.ok) {
      setCloudSnapshots(fresh.data);
      setSelectedSnapshot(fresh.data[0]?.id || "");
    }
    notify(result.message || "Data pushed securely to cloud.");
  }

  async function pullCloudData(snapshotId?: string) {
    if (!window.confirm("Restore cloud data on this computer? A local emergency copy will be created first.")) return;
    setWorking("pull");
    const result = await window.restrozapp.backup.pullCloud(snapshotId);
    setWorking("");
    if (!result.ok) return notify(result.error, true);
    notify("Cloud data restored. Reloading POS...");
    window.setTimeout(() => window.location.reload(), 800);
  }

  async function restoreBackup() {
    if (!window.confirm("Restore a backup? An emergency backup will be created first.")) return;
    setWorking("restore");
    const result = await window.restrozapp.backup.restore();
    setWorking("");
    if (!result.ok) return notify(result.error, true);
    notify("Backup restored. Reloading POS...");
    window.setTimeout(() => window.location.reload(), 800);
  }

  async function testPrinter() {
    setWorking("printer");
    const result = await window.restrozapp.print.test(form?.printerName || undefined);
    setWorking("");
    notify(result.ok ? "Test receipt sent to printer." : result.error, !result.ok);
  }

  async function checkUpdates() {
    setWorking("update");
    const result = await window.restrozapp.updates.check() as { ok: boolean; data?: AppVersion; error?: string };
    setWorking("");
    if (!result.ok || !result.data) return notify(result.error || "Update check failed.", true);
    setUpdate(result.data);
    notify(`Version ${result.data.version} is available.`);
  }

  async function changePassword() {
    if (security.newPassword !== security.confirmPassword) return notify("New passwords do not match.", true);
    setWorking("password");
    const result = await window.restrozapp.pos.changePassword({
      currentPassword: security.currentPassword,
      newPassword: security.newPassword,
    });
    setWorking("");
    if (!result.ok) return notify(result.error, true);
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    notify("Settings password changed.");
  }

  if (loading || !form) {
    return <div className="min-h-[60vh] grid place-items-center text-slate-600"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700"><Settings2 size={20} /><span className="text-sm font-bold">POS Configuration</span></div>
            <h1 className="mt-1 text-2xl font-bold">Restaurant Settings</h1>
            <p className="mt-1 text-sm text-slate-500">Local operations, printing, data protection and device health.</p>
          </div>
          <div className={`inline-flex items-center gap-2 text-sm font-semibold ${system?.online ? "text-emerald-700" : "text-amber-700"}`}>
            {system?.online ? <Wifi size={17} /> : <WifiOff size={17} />}
            {system?.online ? "Cloud connected" : "Offline mode"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav className="border-b border-slate-200 bg-white p-3 lg:min-h-[720px] lg:border-b-0 lg:border-r">
          <div className="flex gap-2 overflow-x-auto lg:grid">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon size={18} />{label}
              </button>
            ))}
          </div>
        </nav>

        <section className="p-4 sm:p-6">
          {tab === "restaurant" && (
            <Section title="Restaurant identity" description="Information shown throughout the POS and printed receipts.">
              <Field label="Restaurant logo" wide locked={locked("restaurantLogo")}>
                <div className="flex flex-wrap items-center gap-4 border border-slate-200 p-4">
                  {form.restaurantLogo ? (
                    <img src={form.restaurantLogo} alt="" className="h-20 w-24 rounded-md border border-slate-200 object-contain" />
                  ) : (
                    <span className="grid h-20 w-24 place-items-center rounded-md bg-slate-100 text-slate-400">
                      <ImageIcon size={28} />
                    </span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className={`settings-secondary cursor-pointer ${locked("restaurantLogo") ? "pointer-events-none opacity-50" : ""}`}>
                      <Upload size={17} />
                      Choose logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={locked("restaurantLogo")}
                        onChange={(event) => {
                          void chooseLogo(event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {form.restaurantLogo && (
                      <button
                        type="button"
                        className="settings-secondary"
                        disabled={locked("restaurantLogo")}
                        onClick={() => {
                          setPendingLogoData(null);
                          updateField("restaurantLogo", "");
                        }}
                      >
                        <Trash2 size={17} />
                        Remove
                      </button>
                    )}
                  </div>
                  <small className="w-full text-xs text-slate-500">PNG, JPEG, or WebP. Maximum 2 MB. The logo is cached for offline receipts.</small>
                </div>
              </Field>
              <Field label="Restaurant name" locked={locked("restaurantName")}><input value={form.restaurantName} disabled={locked("restaurantName")} onChange={(e) => updateField("restaurantName", e.target.value)} /></Field>
              <Field label="Email" locked={locked("email")}><input type="email" value={form.email} disabled={locked("email")} onChange={(e) => updateField("email", e.target.value)} /></Field>
              <Field label="Address" wide locked={locked("address")}><textarea rows={3} value={form.address} disabled={locked("address")} onChange={(e) => updateField("address", e.target.value)} /></Field>
              <Field label="Primary phone" locked={locked("phone1")}><input value={form.phone1} disabled={locked("phone1")} onChange={(e) => updateField("phone1", e.target.value)} /></Field>
              <Field label="Secondary phone" locked={locked("phone2")}><input value={form.phone2} disabled={locked("phone2")} onChange={(e) => updateField("phone2", e.target.value)} /></Field>
              <Field label="Receipt footer" wide locked={locked("footerMessage")}><input value={form.footerMessage} disabled={locked("footerMessage")} onChange={(e) => updateField("footerMessage", e.target.value)} /></Field>
              <Field label="Dining halls" wide locked={locked("halls")}>
                <textarea
                  rows={3}
                  value={form.halls.join("\n")}
                  disabled={locked("halls")}
                  onChange={(event) => updateField(
                    "halls",
                    [...new Set(event.target.value.split(/\r?\n|,/).map((hall) => hall.trim()).filter(Boolean))].slice(0, 20),
                  )}
                  placeholder={"Main Hall\nFamily Hall"}
                />
                <small className="mt-2 block text-xs text-slate-500">Enter one hall per line. Leave empty to hide hall selection from Confirm Order.</small>
              </Field>
            </Section>
          )}

          {tab === "billing" && (
            <Section title="Billing defaults" description="Defaults applied when staff opens and completes an order.">
              <Field label="Tax / service charge (%)" locked={locked("taxPercentage")}><input type="number" min={0} max={100} value={form.taxPercentage} disabled={locked("taxPercentage")} onChange={(e) => updateField("taxPercentage", Number(e.target.value))} /></Field>
              <Field label="Delivery charge (PKR)" locked={locked("deliveryCharges")}><input type="number" min={0} value={form.deliveryCharges} disabled={locked("deliveryCharges")} onChange={(e) => updateField("deliveryCharges", Number(e.target.value))} /></Field>
              <Field label="Default payment method" locked={locked("defaultPaymentMethod")}><select value={form.defaultPaymentMethod} disabled={locked("defaultPaymentMethod")} onChange={(e) => updateField("defaultPaymentMethod", e.target.value as PosSettings["defaultPaymentMethod"])}><option value="cash">Cash</option><option value="card">Card</option><option value="online">Online</option><option value="other">Other</option></select></Field>
            </Section>
          )}

          {tab === "printing" && (
            <Section title="Printing workflow" description="Choose the receipt printer and kitchen ticket behavior.">
              <Field label="Receipt printer" wide locked={locked("printerName")}><select value={form.printerName} disabled={locked("printerName")} onChange={(e) => updateField("printerName", e.target.value)}><option value="">Windows default printer</option>{printers.map((printer) => <option key={printer.name} value={printer.name}>{printer.displayName}{printer.isDefault ? " (Default)" : ""}</option>)}</select></Field>
              <Field label="Receipt width" locked={locked("receiptWidth")}><select value={form.receiptWidth} disabled={locked("receiptWidth")} onChange={(e) => updateField("receiptWidth", e.target.value as PosSettings["receiptWidth"])}><option>58mm</option><option>66mm</option><option>80mm</option></select></Field>
              <Toggle label="Silent quick print" description="Send receipts directly without the Windows print dialog." value={form.quickPrintEnabled} locked={locked("quickPrintEnabled")} onChange={(value) => updateField("quickPrintEnabled", value)} />
              <Toggle label="Print customer token" description="Print a customer waiting token after the kitchen ticket." value={form.printCustomerTicket} locked={locked("printCustomerTicket")} onChange={(value) => updateField("printCustomerTicket", value)} />
              <Toggle label="Split KOT by kitchen" description="Print separate tickets for each kitchen station." value={form.splitKOTByKitchen} locked={locked("splitKOTByKitchen")} onChange={(value) => updateField("splitKOTByKitchen", value)} />
              <div className="sm:col-span-2"><button className="settings-secondary" onClick={testPrinter} disabled={working === "printer"}><Printer size={17} />{working === "printer" ? "Printing..." : "Test printer"}</button></div>
            </Section>
          )}

          {tab === "backup" && (
            <div className="space-y-5">
              <Section title="Cloud data protection" description="Push and pull complete restaurant data without selecting backup files.">
                <InfoRow icon={<HardDrive />} label="Database" value={system?.databasePath || "Not ready"} />
                <InfoRow icon={<ArchiveRestore />} label="Last verified snapshot" value={cloudSnapshots[0]?.verifiedAt ? new Date(cloudSnapshots[0].verifiedAt!).toLocaleString() : "Not created yet"} />
                <InfoRow icon={<RefreshCw />} label="Next scheduled snapshot" value={system?.sync?.nextSnapshotAt ? new Date(system.sync.nextSnapshotAt).toLocaleString() : "Calculated after sync"} />
                <InfoRow icon={<Cloud />} label="Pending sync changes" value={String(system?.sync?.pendingEvents ?? 0)} />
                <InfoRow icon={<Cloud />} label="Queued snapshot uploads" value={String(system?.sync?.pendingSnapshots ?? 0)} />
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button className="settings-primary" onClick={createBackup} disabled={working === "backup"}><Cloud size={17} />{working === "backup" ? "Pushing..." : "Push Backup"}</button>
                  <button className="settings-secondary" onClick={() => pullCloudData()} disabled={!cloudSnapshots.length || working === "pull"}><Download size={17} />{working === "pull" ? "Restoring..." : "Restore Latest Data"}</button>
                </div>
                <div className="sm:col-span-2">
                  <button className="text-sm font-semibold text-emerald-700" onClick={() => setShowAdvancedRecovery((value) => !value)}>{showAdvancedRecovery ? "Hide advanced recovery" : "Choose an older recovery point"}</button>
                </div>
                {showAdvancedRecovery && <><Field label="Older verified snapshot" wide>
                  <select value={selectedSnapshot} onChange={(event) => setSelectedSnapshot(event.target.value)}>
                    <option value="">Select a recovery point</option>
                    {cloudSnapshots.filter((snapshot) => snapshot.status === "verified").map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.snapshotType} - {new Date(snapshot.createdAt).toLocaleString()} - {Math.round(snapshot.sizeBytes / 1024)} KB</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2"><button className="settings-secondary" onClick={() => pullCloudData(selectedSnapshot)} disabled={!selectedSnapshot || working === "pull"}><Download size={17} />Restore selected point</button></div></>}
              </Section>
              <div className="overflow-hidden border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3 font-bold">Recent backup history</div>
                {backups.slice(0, 8).map((backup) => <div key={backup.id} className="grid gap-1 border-b border-slate-100 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]"><span><b>{backup.fileName}</b><small className="mt-1 block text-slate-500">{new Date(backup.createdAt).toLocaleString()}</small></span><span className="font-semibold text-slate-600">{backup.status.replace("_", " ")}</span></div>)}
                {!backups.length && <p className="p-4 text-sm text-slate-500">No backup logs yet.</p>}
              </div>
            </div>
          )}

          {tab === "system" && (
            <Section title="Device and application" description="Activation, connectivity and installed release information.">
              <InfoRow icon={<Cloud />} label="Connection" value={system?.online ? "Online" : "Offline"} />
              <InfoRow icon={<Check />} label="Activation" value={system?.activationStatus || "Unknown"} />
              <InfoRow icon={<Building2 />} label="Restaurant code" value={system?.restaurantCode || "-"} />
              <InfoRow icon={<MonitorCog />} label="Device ID" value={system?.deviceId || "-"} />
              <InfoRow icon={<Settings2 />} label="App version" value={system?.appVersion || "-"} />
              <InfoRow icon={<RefreshCw />} label="Last cloud check" value={system?.lastCheckedAt ? new Date(system.lastCheckedAt).toLocaleString() : "Not checked"} />
              <InfoRow icon={<ArchiveRestore />} label="Pending sync changes" value={String(system?.sync?.pendingEvents ?? 0)} />
              <InfoRow icon={<RefreshCw />} label="Last successful sync" value={system?.sync?.lastSuccessfulSync ? new Date(system.sync.lastSuccessfulSync).toLocaleString() : "Not synced yet"} />
              <InfoRow icon={<ShieldCheck />} label="Offline lease expires" value={system?.leaseExpiresAt ? new Date(system.leaseExpiresAt).toLocaleString() : "Online verification required"} />
              <div className="sm:col-span-2"><button className="settings-secondary" onClick={checkUpdates} disabled={working === "update"}><RefreshCw size={17} />{working === "update" ? "Checking..." : "Check for updates"}</button>{update && <p className="mt-3 text-sm text-slate-600"><b>Version {update.version}</b> - {update.notes || "No release notes"}</p>}</div>
            </Section>
          )}

          {tab === "security" && (
            <Section title="Protected settings" description="Changing sensitive POS configuration requires the local settings password.">
              <Field label="Current password"><input type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} /></Field>
              <div />
              <Field label="New password"><input type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} /></Field>
              <Field label="Confirm password"><input type="password" value={security.confirmPassword} onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} /></Field>
              <div className="sm:col-span-2"><button className="settings-primary" onClick={changePassword} disabled={working === "password"}><KeyRound size={17} />{working === "password" ? "Changing..." : "Change password"}</button><p className="mt-3 text-xs text-slate-500">The password is stored as a salted scrypt hash. Existing installations default to <b>admin123</b> until changed.</p></div>
            </Section>
          )}
        </section>
      </div>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-300 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:left-72">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">You have unsaved settings.</p>
            <div className="flex gap-2"><button className="settings-secondary" onClick={() => setForm(saved)}>Discard</button><button className="settings-primary" onClick={() => setShowPassword(true)}><Save size={17} />Save changes</button></div>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onMouseDown={() => !working && setShowPassword(false)}>
          <div className="w-full max-w-sm bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center bg-emerald-100 text-emerald-800"><LockKeyhole /></span><div><h2 className="font-bold">Confirm settings change</h2><p className="text-sm text-slate-500">Enter the local settings password.</p></div></div>
            <input autoFocus type="password" className="mt-5 w-full" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
            <div className="mt-4 flex justify-end gap-2"><button className="settings-secondary" onClick={() => setShowPassword(false)}>Cancel</button><button className="settings-primary" onClick={save} disabled={working === "save"}>{working === "save" ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}Save</button></div>
          </div>
        </div>
      )}

      {message && <button className={`fixed right-5 top-20 z-[60] px-4 py-3 text-sm font-semibold text-white shadow-xl ${message.error ? "bg-red-600" : "bg-emerald-700"}`} onClick={() => setMessage(null)}>{message.text}</button>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="border border-slate-200 bg-white"><div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">{children}</div></div>;
}

function Field({ label, locked, wide, children }: { label: string; locked?: boolean; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">{label}{locked && <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"><LockKeyhole size={11} />Admin managed</span>}</span>{children}</label>;
}

function Toggle({ label, description, value, locked, onChange }: { label: string; description: string; value: boolean; locked?: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 border border-slate-200 p-4"><div><p className="flex items-center gap-2 text-sm font-bold">{label}{locked && <LockKeyhole size={13} className="text-slate-400" />}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div><button type="button" disabled={locked} aria-pressed={value} onClick={() => onChange(!value)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? "bg-emerald-600" : "bg-slate-300"} disabled:opacity-50`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${value ? "left-6" : "left-1"}`} /></button></div>;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-3 border border-slate-200 p-4 text-sm"><span className="mt-0.5 text-emerald-700">{icon}</span><span className="min-w-0"><small className="block font-semibold text-slate-500">{label}</small><b className="mt-1 block break-all text-slate-800">{value}</b></span></div>;
}
