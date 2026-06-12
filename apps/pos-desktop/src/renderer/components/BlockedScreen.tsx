export function BlockedScreen({ message }: { message?: string }) {
  return (
    <main className="auth-screen">
      <section className="auth-panel danger">
        <h1>Device blocked</h1>
        <p>{message || "This device has been blocked by the admin panel."}</p>
      </section>
    </main>
  );
}
