import { AlertTriangle } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RemoteDataActions } from "@/components/RemoteDataActions";
import { getAdminSnapshot } from "@/lib/data";

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const filters = await searchParams;
  const data = await getAdminSnapshot();
  const backups = data.backups.filter((item: any) => (!filters.status || filters.status === "all" || item.status === filters.status) && (!filters.type || filters.type === "all" || item.type === filters.type));
  const latestByRestaurant = new Map<string, any>();
  data.snapshots.filter((item: any) => item.status === "verified").forEach((item: any) => {
    if (!latestByRestaurant.has(item.restaurant_code)) latestByRestaurant.set(item.restaurant_code, item);
  });
  const stale = data.restaurants.filter((restaurant: any) => {
    const latest = latestByRestaurant.get(restaurant.restaurant_code);
    const verifiedAt = latest?.verified_at || latest?.created_at;
    return !verifiedAt || Date.now() - new Date(verifiedAt).getTime() > 8 * 24 * 60 * 60 * 1000;
  });
  return <>
    <LiveRefresh />
    <PageHeader title="Backups" description="Monitor continuous sync, cloud snapshots and restore readiness." />
    <div className="panel"><div className="panel-title"><div><h2>Recovery snapshots</h2><p>Complete encrypted transport archives available to approved devices.</p></div></div><div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Created</th><th>Type</th><th>Sequence</th><th>Size</th><th>Status</th></tr></thead><tbody>
      {(data.snapshots || []).map((item: any) => <tr key={item.id}><td>{item.restaurant_code}</td><td>{new Date(item.verified_at || item.created_at).toLocaleString()}</td><td>{item.snapshot_type}</td><td>{item.sync_sequence}</td><td>{Math.round(Number(item.size_bytes || 0) / 1024)} KB</td><td><StatusBadge value={item.status} /></td></tr>)}
    </tbody></table></div>{!(data.snapshots || []).length && <p className="empty-inline">No cloud snapshots yet.</p>}</div>
    {stale.length > 0 && <div className="warning-banner"><AlertTriangle /><span><b>{stale.length} restaurant(s) need attention.</b> No verified recovery snapshot exists within the last 8 days.</span></div>}
    <div className="panel">
      <div className="panel-title"><div><h2>Remote recovery controls</h2><p>Queue a backup or latest-data restore for a particular restaurant. Its approved POS executes the request while online.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Latest snapshot</th><th>Last sync</th><th>Actions</th></tr></thead><tbody>
        {data.restaurants.map((restaurant: any) => {
          const latest = latestByRestaurant.get(restaurant.restaurant_code);
          const checkpoint = data.checkpoints.find((item: any) => item.restaurant_id === restaurant.id);
          return <tr key={restaurant.id}>
            <td><b>{restaurant.name}</b><small>{restaurant.restaurant_code}</small></td>
            <td>{latest ? new Date(latest.verified_at || latest.created_at).toLocaleString() : "Not available"}</td>
            <td>{checkpoint?.last_synced_at ? new Date(checkpoint.last_synced_at).toLocaleString() : "Never"}</td>
            <td><RemoteDataActions restaurantId={restaurant.id} restaurantName={restaurant.name} /></td>
          </tr>;
        })}
      </tbody></table></div>
    </div>
    <form className="filter-form"><select name="status" defaultValue={filters.status || "all"}><option value="all">All statuses</option><option>uploaded</option><option>pending_upload</option><option>failed</option><option>local_only</option></select><select name="type" defaultValue={filters.type || "all"}><option value="all">All types</option><option>manual</option><option>daily</option><option>weekly</option><option>monthly</option><option>emergency</option></select><button className="button secondary">Apply</button></form>
    <div className="panel"><div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Type</th><th>File</th><th>Size</th><th>Created</th><th>Status</th></tr></thead><tbody>
      {backups.map((item: any) => <tr key={item.id}><td>{item.restaurant_code}</td><td>{item.type}</td><td><b>{item.file_name}</b><small>{item.storage_path || "No cloud path"}</small></td><td>{Math.round(Number(item.size_bytes || 0) / 1024)} KB</td><td>{new Date(item.created_at).toLocaleString()}</td><td><StatusBadge value={item.status} /></td></tr>)}
    </tbody></table></div>{!backups.length && <p className="empty-inline">No backup records match these filters.</p>}</div>
  </>;
}
