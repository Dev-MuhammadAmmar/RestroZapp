import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return withSecurityHeaders(response);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) => {
        entries.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        entries.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  try {
    await supabase.auth.getUser();
  } catch (error) {
    console.warn("Supabase session refresh is temporarily unavailable.", error);
    response.headers.set("X-RestroZapp-Auth-Status", "unavailable");
  }
  return withSecurityHeaders(response);
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
