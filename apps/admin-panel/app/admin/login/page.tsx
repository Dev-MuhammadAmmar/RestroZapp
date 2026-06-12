import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login-page">
      <LoginForm initialError={error === "supabase_unavailable"
        ? "Supabase is temporarily unreachable. Your session is safe; retry shortly."
        : error === "owner_access_required"
          ? "This account does not have owner access."
          : ""} />
    </main>
  );
}
