import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export function ActivationScreen({ onChanged }: { onChanged: () => void }) {
  const [restaurantCode, setRestaurantCode] = useState("");
  const [activationPassword, setActivationPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    const result: any = await window.restrozapp.activation.request({
      restaurantCode,
      activationPassword,
    });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(result.data.message || "Activation request sent.");
    onChanged();
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-mark"><ShieldCheck size={30} /></div>
        <h1>RestroZapp POS</h1>
        <p>Activate this computer before opening the offline POS.</p>
        <label>
          Restaurant Code
          <input value={restaurantCode} onChange={(event) => setRestaurantCode(event.target.value)} placeholder="SRP-001" />
        </label>
        <label>
          Activation Password
          <input
            type="password"
            value={activationPassword}
            onChange={(event) => setActivationPassword(event.target.value)}
            placeholder="Enter activation password"
          />
        </label>
        <button disabled={loading || !restaurantCode || !activationPassword} onClick={submit}>
          {loading ? "Sending..." : "Send Activation Request"}
        </button>
        <small>Development shortcut: use password <b>approve-now</b> to unlock locally.</small>
        {message && <p className="notice">{message}</p>}
      </section>
    </main>
  );
}
