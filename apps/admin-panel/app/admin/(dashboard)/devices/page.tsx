import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { getAdminSnapshot } from "@/lib/data";
import { InlineActionForm } from "@/components/ActionForm";
import {
  approveDeviceAction,
  blockDeviceAction,
  unblockDeviceAction,
} from "../../actions";

export default async function DevicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const data = await getAdminSnapshot();
  const devices = status === "all" ? data.devices : data.devices.filter((item: any) => item.status === status);
  return <>
    <PageHeader title="Devices" description="Approve each new computer, block access and monitor installed versions." />
    <div className="filter-bar">{["all","pending","approved","blocked"].map((value) => <a key={value} className={status === value ? "active" : ""} href={`/admin/devices?status=${value}`}>{value}</a>)}</div>
    <div className="panel"><div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Computer</th><th>OS</th><th>Version</th><th>Last seen</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {devices.map((device: any) => <tr key={device.id}><td>{device.restaurant_code}</td><td><b>{device.computer_name}</b></td><td>{device.os}</td><td>{device.app_version}</td><td>{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "Never"}</td><td><StatusBadge value={device.status} /></td><td><div className="button-row">
        {device.status !== "approved" && device.status !== "blocked" && <InlineActionForm action={approveDeviceAction} fields={{ deviceId: device.id }} label="Approve" />}
        {device.status !== "blocked" && <InlineActionForm action={blockDeviceAction} fields={{ deviceId: device.id }} label="Block" danger />}
        {device.status === "blocked" && <InlineActionForm action={unblockDeviceAction} fields={{ deviceId: device.id }} label="Unblock" />}
      </div></td></tr>)}
    </tbody></table></div>{!devices.length && <p className="empty-inline">No devices match this filter.</p>}</div>
  </>;
}
