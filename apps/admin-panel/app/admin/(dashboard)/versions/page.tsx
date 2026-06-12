import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { getAdminSnapshot } from "@/lib/data";
import { ActionForm } from "@/components/ActionForm";
import { publishVersionAction } from "../../actions";

export default async function VersionsPage() {
  const data = await getAdminSnapshot();
  return <>
    <PageHeader title="App versions" description="Publish desktop releases and control required updates." />
    <section className="detail-grid">
      <div className="panel"><div className="panel-title"><div><h2>Release history</h2><p>Newest releases appear first.</p></div></div><div className="simple-rows">{data.versions.map((item: any) => <div key={item.id}><span><b>{item.version}</b><small>{item.notes || "No release notes"}</small></span><span><StatusBadge value={item.is_latest ? "latest" : item.required ? "required" : "optional"} /></span></div>)}</div></div>
      <div className="panel"><div className="panel-title"><div><h2>Create release</h2><p>The download URL must be HTTPS.</p></div></div><ActionForm className="form-grid" action={publishVersionAction} submitLabel="Save release" pendingLabel="Saving release..."><label>Version<input name="version" placeholder="0.2.0" required /></label><label>Status<select name="status" defaultValue="published"><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="span-2">Download URL<input type="url" name="downloadUrl" placeholder="https://..." required /></label><label className="span-2">Release notes<textarea name="notes" required /></label><label className="check-label"><input type="checkbox" name="required" /> Required update</label><label className="check-label"><input type="checkbox" name="isLatest" defaultChecked /> Mark as latest</label></ActionForm></div>
    </section>
  </>;
}
