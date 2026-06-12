"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export function FeedbackForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/feedback", { method: "POST", body: new FormData(form) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || "Unable to send feedback. Please retry.");
        setState("error");
        return;
      }
      setMessage(`Request ${result.ticketNumber} was received.`);
      setState("sent");
      form.reset();
    } catch {
      setMessage("Cannot reach the support service. Check your connection and retry.");
      setState("error");
    }
  }

  return <form className="feedback-form" onSubmit={submit}><label>Your name<input name="name" maxLength={100} required /></label><label>Email<input name="email" type="email" maxLength={160} required /></label><label>Restaurant code <small>Optional</small><input name="restaurantCode" maxLength={40} /></label><label>Topic<select name="category"><option value="support">Product support</option><option value="activation">Activation</option><option value="backup">Backup or recovery</option><option value="printing">Printing</option><option value="feedback">Product feedback</option></select></label><label className="span-2">Message<textarea name="message" minLength={10} maxLength={3000} required /></label><div className="span-2 feedback-actions"><button className="public-button primary" disabled={state === "sending"}>{state === "sending" ? <Loader2 className="spin" /> : <Send />}{state === "sending" ? "Sending..." : state === "error" ? "Retry request" : "Send request"}</button>{message && <p role={state === "error" ? "alert" : "status"} className={state === "error" ? "form-error" : "form-success"}>{message}</p>}</div></form>;
}
