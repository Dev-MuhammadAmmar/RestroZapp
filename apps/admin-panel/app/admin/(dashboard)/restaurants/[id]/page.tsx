import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RemoteDataActions } from "@/components/RemoteDataActions";
import { ActionForm } from "@/components/ActionForm";
import { getRestaurantDetail } from "@/lib/data";
import {
  rotateActivationSecretAction,
  updateRestaurantAction,
  updateRestaurantConfigAction,
} from "../../../actions";

const lockable = ["restaurantName","restaurantLogo","address","phone1","phone2","email","taxPercentage","deliveryCharges","footerMessage","halls","defaultPaymentMethod","printCustomerTicket","splitKOTByKitchen","quickPrintEnabled","receiptWidth","printerName"];

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getRestaurantDetail(id);
  if (!data.restaurant) notFound();
  const config = data.config || { settings: {}, locked_setting_keys: [] };
  const updateProfile = updateRestaurantAction.bind(null, id);
  const rotateSecret = rotateActivationSecretAction.bind(null, id);
  const updateConfig = updateRestaurantConfigAction.bind(null, id);
  return <>
    <LiveRefresh />
    <PageHeader title={data.restaurant.name} description={`${data.restaurant.restaurant_code} - owner configuration and health`} action={<StatusBadge value={data.restaurant.status} />} />
    <section className="detail-grid">
      <div className="panel">
        <div className="panel-title"><div><h2>Profile and plan</h2><p>Account-level settings controlled by the owner.</p></div></div>
        <ActionForm className="form-grid" action={updateProfile} submitLabel="Save profile" pendingLabel="Saving profile...">
          <label>Name<input name="name" defaultValue={data.restaurant.name} required /></label>
          <label>Status<select name="status" defaultValue={data.restaurant.status}><option>active</option><option>trial</option><option>suspended</option></select></label>
          <label>Plan<input name="plan" defaultValue={data.restaurant.plan} /></label>
          <label>Phone<input name="phone1" defaultValue={data.restaurant.phone1} /></label>
          <label className="span-2">Address<textarea name="address" defaultValue={data.restaurant.address} /></label>
        </ActionForm>
      </div>
      <div className="panel">
        <div className="panel-title"><div><h2>Activation security</h2><p>Rotate the one-time password shared with a restaurant.</p></div></div>
        <ActionForm className="form-grid" action={rotateSecret} submitLabel="Rotate password" pendingLabel="Rotating..." buttonClassName="button danger-outline">
          <label>New activation password<input type="password" minLength={6} name="activationPassword" required /></label>
        </ActionForm>
      </div>
    </section>
    <div className="panel">
      <div className="panel-title"><div><h2>Cloud configuration and locks</h2><p>Locked values are read-only in the restaurant POS.</p></div></div>
      <ActionForm action={updateConfig} className="config-form" submitLabel="Save cloud configuration" pendingLabel="Saving configuration...">
        <div className="form-grid form-grid-3">
          <label>Restaurant name<input name="restaurantName" defaultValue={config.settings?.restaurantName || data.restaurant.name || ""} required /></label>
          <label>Existing logo reference<input name="restaurantLogo" defaultValue={config.settings?.restaurantLogo || data.restaurant.logo_url || ""} placeholder="https://..." /></label>
          <label>Upload restaurant logo<input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp" /></label>
          <label>Primary phone<input name="phone1" defaultValue={config.settings?.phone1 || data.restaurant.phone1 || ""} /></label>
          <label>Secondary phone<input name="phone2" defaultValue={config.settings?.phone2 || data.restaurant.phone2 || ""} /></label>
          <label>Email<input type="email" name="email" defaultValue={config.settings?.email || ""} /></label>
          <label className="span-2">Address<textarea name="address" defaultValue={config.settings?.address || data.restaurant.address || ""} /></label>
          <label className="span-2">Dining halls<textarea name="halls" defaultValue={Array.isArray(config.settings?.halls) ? config.settings.halls.join("\n") : ""} placeholder={"Main Hall\nFamily Hall"} /></label>
          <label>Receipt footer<input name="footerMessage" defaultValue={config.settings?.footerMessage || config.receipt_footer || ""} /></label>
          <label>Tax / service charge<input type="number" min="0" max="100" step="0.5" name="taxPercentage" defaultValue={config.settings?.taxPercentage || 0} /></label>
          <label>Delivery charge<input type="number" min="0" name="deliveryCharges" defaultValue={config.settings?.deliveryCharges || 0} /></label>
          <label>Receipt width<select name="receiptWidth" defaultValue={config.settings?.receiptWidth || "66mm"}><option>58mm</option><option>66mm</option><option>80mm</option></select></label>
          <label>Default payment<select name="defaultPaymentMethod" defaultValue={config.settings?.defaultPaymentMethod || "cash"}><option value="cash">Cash</option><option value="card">Card</option><option value="online">Online</option><option value="other">Other</option></select></label>
          <label>Printer name<input name="printerName" defaultValue={config.settings?.printerName || ""} placeholder="Leave blank for Windows default" /></label>
          <label className="check-label"><input type="checkbox" name="backupEnabled" defaultChecked={config.backup_enabled ?? true} /> Cloud backups enabled</label>
          <label className="check-label"><input type="checkbox" name="quickPrintEnabled" defaultChecked={config.settings?.quickPrintEnabled ?? true} /> Silent quick print</label>
          <label className="check-label"><input type="checkbox" name="printCustomerTicket" defaultChecked={config.settings?.printCustomerTicket ?? true} /> Customer ticket</label>
          <label className="check-label"><input type="checkbox" name="splitKOTByKitchen" defaultChecked={config.settings?.splitKOTByKitchen ?? false} /> Split KOT by kitchen</label>
        </div>
        <h3 className="subheading">Admin-managed fields</h3>
        <div className="lock-grid">{lockable.map((key) => <label key={key} className="check-label"><input type="checkbox" name="lockedKeys" value={key} defaultChecked={(config.locked_setting_keys || []).includes(key)} />{key}</label>)}</div>
      </ActionForm>
    </div>
    <section className="detail-grid">
      <div className="panel"><div className="panel-title"><div><h2>Devices</h2><p>{data.devices.length} registered</p></div></div><SimpleRows rows={data.devices} empty="No registered devices." render={(item) => <><span><b>{item.computer_name}</b><small>{item.app_version}</small></span><StatusBadge value={item.status} /></>} /></div>
      <div className="panel"><div className="panel-title"><div><h2>Cloud recovery</h2><p>Snapshots and continuous sync health</p></div></div><SimpleRows rows={data.snapshots.slice(0, 6)} empty="No recovery snapshots uploaded." render={(item) => <><span><b>{item.file_name}</b><small>{new Date(item.verified_at || item.created_at).toLocaleString()} - sequence {item.sync_sequence}</small></span><StatusBadge value={item.status} /></>} />{data.checkpoints[0] && <p className="empty-inline">Last sync: {data.checkpoints[0].last_synced_at ? new Date(data.checkpoints[0].last_synced_at).toLocaleString() : "Never"}</p>}</div>
    </section>
    <div className="panel">
      <div className="panel-title"><div><h2>Remote data actions</h2><p>The approved POS executes these commands when it is online.</p></div></div>
        <RemoteDataActions restaurantId={id} restaurantName={data.restaurant.name} />
      <SimpleRows rows={(data.commands || []).slice(0, 6)} empty="No remote data commands." render={(item) => <><span><b>{item.action.replaceAll("_", " ")}</b><small>{item.result_message || item.error || new Date(item.requested_at).toLocaleString()}</small></span><StatusBadge value={item.status} /></>} />
    </div>
    <div className="panel"><div className="panel-title"><div><h2>Recent activity</h2><p>Activation and owner events for this restaurant.</p></div></div><SimpleRows rows={data.events} empty="No activity has been recorded." render={(item) => <><span><b>{item.event_type}</b><small>{item.message}</small></span><time>{new Date(item.created_at).toLocaleString()}</time></>} /></div>
  </>;
}

function SimpleRows({ rows, empty, render }: { rows: any[]; empty: string; render: (item: any) => ReactNode }) {
  return <div className="simple-rows">{rows.map((item) => <div key={item.id}>{render(item)}</div>)}{!rows.length && <p className="empty-inline">{empty}</p>}</div>;
}
