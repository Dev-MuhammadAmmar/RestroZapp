import { MessageSquareText } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";
import { ActionForm } from "@/components/ActionForm";
import { updateSupportTicketAction } from "../../actions";

export default async function SupportPage() {
  let tickets: any[] = [];
  let setupError = "";
  try {
    const result = await createSupabaseAdminClient().from("support_tickets").select("*").order("created_at", { ascending: false }).limit(100);
    if (result.error) {
      setupError = /does not exist|schema cache|could not find the table/i.test(result.error.message)
        ? "Support storage is not ready. Apply the RestroZapp support migration in Supabase."
        : result.error.message;
    } else {
      tickets = result.data || [];
    }
  } catch {
    setupError = "Cannot reach Supabase. Check the server connection and retry.";
  }
  return <>
    <PageHeader title="Support" description="Review product questions, activation issues, recovery requests, and feedback." />
    <section className="panel">
      <div className="panel-title"><div><h2><MessageSquareText /> Support tickets</h2><p>{tickets?.length || 0} recent requests</p></div></div>
      {setupError && <p className="form-error" role="alert">{setupError}</p>}
      <div className="support-list">{tickets.map((ticket) => <article key={ticket.id}>
        <div className="support-meta"><b>{ticket.ticket_number}</b><StatusBadge value={ticket.status} /><span>{ticket.category}</span><time>{new Date(ticket.created_at).toLocaleString()}</time></div>
        <h3>{ticket.requester_name} <small>{ticket.requester_email}</small></h3>
        {ticket.restaurant_code && <p className="support-restaurant">Restaurant: {ticket.restaurant_code}</p>}
        <p>{ticket.message}</p>
        <ActionForm action={updateSupportTicketAction.bind(null, ticket.id)} submitLabel="Update" pendingLabel="Updating..." buttonClassName="small-button"><select name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><input name="ownerNote" defaultValue={ticket.owner_note || ""} placeholder="Internal owner note" /></ActionForm>
      </article>)}</div>
      {!tickets.length && !setupError && <p className="empty-state">No support tickets yet.</p>}
    </section>
  </>;
}
