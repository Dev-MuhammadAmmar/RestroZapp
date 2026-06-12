import { PageHeader } from "@/components/AdminShell";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabaseServer";

export default async function ActivityPage() {
  let events: any[] = [];
  if (hasSupabaseAdminEnv()) {
    const supabase = createSupabaseAdminClient();
    const [activation, admin] = await Promise.all([
      supabase.from("activation_events").select("*").order("created_at", { ascending: false }).limit(60),
      supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(60),
    ]);
    events = [...(activation.data || []), ...(admin.data || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 100);
  }
  return <>
    <PageHeader title="Activity" description="Activation attempts and privileged owner changes." />
    <div className="panel"><div className="activity-list">{events.map((event) => <div key={`${event.id}-${event.event_type}`}><span className="activity-dot" /><span><b>{event.event_type}</b><small>{event.restaurant_code || "System"} - {event.message || "No details"}</small></span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</div>{!events.length && <p className="empty-inline">No activity records are available.</p>}</div>
  </>;
}
