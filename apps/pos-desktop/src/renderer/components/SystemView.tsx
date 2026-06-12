import { useEffect, useState } from "react";
import { ArchiveRestore, Database, Download, RotateCcw } from "lucide-react";
import type { BackupLog, SystemStatus } from "@restrozapp/shared";

export function SystemView({ system }: { system: SystemStatus | null }) {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const result = await window.restrozapp.backup.listLogs();
    if (result.ok) setLogs(result.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createBackup() {
    const result = await window.restrozapp.backup.createNow("manual");
    setMessage(result.ok ? `Backup created: ${result.data.fileName}` : result.error);
    await load();
  }

  async function restore() {
    const result = await window.restrozapp.backup.restore();
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Backup restored. Reloading POS...");
    window.setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="system-grid">
      <section className="panel">
        <div className="panel-heading"><div><h3>Local Database</h3><p>Restaurant-specific offline storage</p></div><Database /></div>
        <div className="path-box">{system?.databasePath || "Database not ready"}</div>
        <div className="system-fact"><span>Application version</span><b>{system?.appVersion}</b></div>
        <div className="system-fact"><span>Connection</span><b>{system?.online ? "Online" : "Offline mode"}</b></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h3>Backup & Restore</h3><p>ZIP backups with safe restore protection</p></div><ArchiveRestore /></div>
        <div className="actions">
          <button onClick={createBackup}><Download size={16} /> Create Backup</button>
          <button className="secondary" onClick={restore}><RotateCcw size={16} /> Restore ZIP</button>
        </div>
        <div className="log-list">
          {logs.slice(0, 8).map((log) => (
            <div key={log.id}><span><b>{log.fileName}</b><small>{new Date(log.createdAt).toLocaleString()}</small></span><em>{log.status.replace("_", " ")}</em></div>
          ))}
          {!logs.length && <small>No backup logs yet.</small>}
        </div>
        {message && <p className="inline-notice">{message}</p>}
      </section>
    </div>
  );
}
