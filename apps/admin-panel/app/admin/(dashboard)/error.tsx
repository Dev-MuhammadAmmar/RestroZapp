"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div>
          <h2>Dashboard data could not be loaded</h2>
          <p>{error.message || "Check the Supabase configuration and try again."}</p>
        </div>
      </div>
      <button className="button" onClick={reset}>Try again</button>
    </div>
  );
}
