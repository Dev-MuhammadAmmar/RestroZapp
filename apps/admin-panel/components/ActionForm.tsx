"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  initialAdminActionState,
  type AdminActionState,
} from "@/lib/actionState";

type Action = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

export function ActionForm({
  action,
  children,
  className,
  submitLabel,
  pendingLabel = "Saving...",
  buttonClassName = "button",
  confirmMessage,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel?: string;
  buttonClassName?: string;
  confirmMessage?: string;
}) {
  const [state, formAction] = useActionState(action, initialAdminActionState);

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
      <ActionMessage state={state} />
      <SubmitButton
        label={submitLabel}
        pendingLabel={pendingLabel}
        className={buttonClassName}
      />
    </form>
  );
}

export function InlineActionForm({
  action,
  fields,
  label,
  pendingLabel,
  danger,
  confirmMessage,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  danger?: boolean;
  confirmMessage?: string;
}) {
  const [state, formAction] = useActionState(action, initialAdminActionState);
  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
        }}
      >
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <SubmitButton
          label={label}
          pendingLabel={pendingLabel || `${label}...`}
          className={`small-button ${danger ? "danger" : ""}`}
        />
      </form>
      <ActionMessage state={state} compact />
    </div>
  );
}

export function ActionMessage({
  state,
  compact = false,
}: {
  state: AdminActionState;
  compact?: boolean;
}) {
  if (state.status === "idle") return null;
  const success = state.status === "success";
  return (
    <div
      className={`${success ? "form-success" : "form-error"}${compact ? " action-message-compact" : ""}`}
      role={success ? "status" : "alert"}
    >
      {state.message}
      {state.fieldErrors && (
        <ul>
          {Object.entries(state.fieldErrors).flatMap(([field, messages]) =>
            messages.map((message) => <li key={`${field}-${message}`}>{message}</li>),
          )}
        </ul>
      )}
    </div>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending && <Loader2 className="spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}
