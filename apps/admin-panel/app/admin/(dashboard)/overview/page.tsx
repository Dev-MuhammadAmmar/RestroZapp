import type { ReactNode } from "react";
import { AlertTriangle, Archive, Building2, Laptop, UploadCloud } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { getAdminSnapshot } from "@/lib/data";

export default async function OverviewPage() {
  const data = await getAdminSnapshot();
  const pending = data.devices.filter((entry: any) => entry.status === "pending");
  const verifiedSnapshots = data.snapshots.filter((entry: any) => entry.status === "verified");
  return <>
    <PageHeader title="Overview" description="Activation, backup health and release status across every restaurant." action={<span className="connection-state">{data.mode === "supabase" ? "Supabase connected" : "Development demo"}</span>} />
    <section className="stats-grid">
      <Metric icon={<Building2 />} label="Restaurants" value={data.restaurants.length} />
      <Metric icon={<Laptop />} label="Registered devices" value={data.devices.length} />
      <Metric icon={<AlertTriangle />} label="Pending approval" value={pending.length} tone="warning" />
      <Metric icon={<UploadCloud />} label="Verified snapshots" value={verifiedSnapshots.length} />
    </section>
    <section className="content-grid">
      <div className="panel"><div className="panel-title"><div><h2>Pending devices</h2><p>Devices waiting for owner approval.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Computer</th><th>Version</th><th>Status</th></tr></thead><tbody>{pending.slice(0, 6).map((device: any) => <tr key={device.id}><td>{device.restaurant_code}</td><td>{device.computer_name}</td><td>{device.app_version}</td><td><StatusBadge value={device.status} /></td></tr>)}</tbody></table></div>
        {!pending.length && <p className="empty-inline">No devices are waiting for approval.</p>}
      </div>
      <div className="panel"><div className="panel-title"><div><h2>Latest release</h2><p>Desktop application distribution status.</p></div><Archive /></div>
        {data.versions[0] ? <div className="release-summary"><b>{data.versions[0].version}</b><StatusBadge value={data.versions[0].required ? "required" : "optional"} /><p>{data.versions[0].notes || "No release notes."}</p></div> : <p className="empty-inline">No version has been published.</p>}
      </div>
    </section>
  </>;
}

function Metric({ icon, label, value, tone = "" }: { icon: ReactNode; label: string; value: number; tone?: string }) {
  return <div className={`metric ${tone}`}><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>;
}
