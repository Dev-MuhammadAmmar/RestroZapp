import { Clock3, RefreshCw } from "lucide-react";

export function WaitingScreen({ message, onChanged }: { message?: string; onChanged: () => void }) {
  async function refresh() {
    await window.restrozapp.activation.refresh();
    onChanged();
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-mark pending"><Clock3 size={30} /></div>
        <h1>Waiting for approval</h1>
        <p>{message || "Activation request sent. Approve this device from the admin panel."}</p>
        <button onClick={refresh}><RefreshCw size={16} /> Refresh Status</button>
      </section>
    </main>
  );
}
