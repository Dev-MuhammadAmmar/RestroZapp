"use client";

import { useActionState } from "react";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { loginAction } from "../actions";
import { initialAdminActionState } from "@/lib/actionState";

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [state, action] = useActionState(loginAction, initialAdminActionState);

  return (
    <form action={action} className="login-panel">
      <div className="login-brand"><span><Image src="/restrozapp-icon.png" alt="" width={38} height={38} priority /></span><div><b>RestroZapp</b><small>Owner Console</small></div></div>
      <div><h1>Welcome back</h1><p>Sign in with your authorized owner account.</p></div>
      <label>Email<div className="input-icon"><Mail /><input name="email" type="email" required autoComplete="email" /></div></label>
      <label>Password<div className="input-icon"><LockKeyhole /><input name="password" type="password" required autoComplete="current-password" /></div></label>
      {(state.status !== "idle" || initialError) && <p className="form-error" role="alert">{state.message || initialError}</p>}
      <LoginButton />
      <small className="login-note">Public registration is disabled. Owner accounts are created in Supabase Auth.</small>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return <button className="button" disabled={pending}>{pending && <Loader2 className="spin" />}{pending ? "Signing in..." : "Sign in"}</button>;
}
