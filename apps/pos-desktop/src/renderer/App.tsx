import { useEffect, useState } from "react";
import type { ActivationState } from "@restrozapp/shared";
import { ActivationScreen } from "./components/ActivationScreen";
import { BlockedScreen } from "./components/BlockedScreen";
import { WaitingScreen } from "./components/WaitingScreen";
import { AppShell } from "./features/AppShell";

const DEVICE_STATUS_INTERVAL_MS = 60_000;

export default function App() {
  const [state, setState] = useState<ActivationState | null>(null);

  async function loadState() {
    const nextState = (await window.restrozapp.activation.getState()) as ActivationState;
    setState(nextState);
    if (nextState.deviceId && nextState.restaurant?.restaurantCode) {
      const refreshed = await window.restrozapp.activation.refresh() as
        | { ok: true; data: ActivationState }
        | { ok: false; error: string };
      if (refreshed.ok) setState(refreshed.data);
    }
  }

  useEffect(() => {
    loadState();
    return window.restrozapp.pos.onSettingsChanged(async () => {
      const result = await window.restrozapp.pos.getSettings();
      if (!result.ok) return;
      setState((current) => current?.restaurant ? {
        ...current,
        restaurant: {
          ...current.restaurant,
          restaurantName: result.data.restaurantName,
          address: result.data.address,
          phone1: result.data.phone1,
          phone2: result.data.phone2,
          receiptFooter: result.data.footerMessage,
        },
      } : current);
    });
  }, []);

  useEffect(() => {
    if (!state || !state.deviceId || !state.restaurant?.restaurantCode) return;

    let checking = false;
    const syncStatus = async () => {
      if (checking) return;
      checking = true;
      try {
        const result = await window.restrozapp.activation.refresh() as
          | { ok: true; data: ActivationState }
          | { ok: false; error: string };
        if (result.ok) {
          setState(result.data);
          document.dispatchEvent(new Event("restrozapp-settings-changed"));
        }
      } finally {
        checking = false;
      }
    };

    const checkWhenOnline = () => void syncStatus();
    const checkWhenFocused = () => {
      if (document.visibilityState === "visible") void syncStatus();
    };

    void syncStatus();
    const timer = window.setInterval(syncStatus, DEVICE_STATUS_INTERVAL_MS);
    window.addEventListener("online", checkWhenOnline);
    window.addEventListener("focus", checkWhenFocused);
    document.addEventListener("visibilitychange", checkWhenFocused);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", checkWhenOnline);
      window.removeEventListener("focus", checkWhenFocused);
      document.removeEventListener("visibilitychange", checkWhenFocused);
    };
  }, [state?.status, state?.deviceId, state?.restaurant?.restaurantCode]);

  if (!state) return <div className="classic-ui"><div className="boot">Opening RestroZapp POS...</div></div>;
  if (state.status === "blocked") return <div className="classic-ui"><BlockedScreen message={state.message} /></div>;
  if (state.status === "pending") {
    return <div className="classic-ui"><WaitingScreen message={state.message} onChanged={loadState} /></div>;
  }
  if (state.status !== "approved") {
    return <div className="classic-ui"><ActivationScreen onChanged={loadState} /></div>;
  }
  return <AppShell state={state} />;
}
