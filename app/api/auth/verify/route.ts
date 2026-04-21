import { type NextRequest, NextResponse } from "next/server";
import { verifyMagicToken } from "@/lib/auth/tokens";
import { checkEmailAccess } from "@/lib/auth/access";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Always use AUTH_URL env var for redirects — never req.url.
 * Behind a reverse proxy (Traefik), req.url contains the internal
 * container address (0.0.0.0:3000) instead of the public hostname.
 */
function baseUrl(req: NextRequest): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  // Fallback: reconstruct from forwarded headers
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base  = baseUrl(req);

  if (!token) {
    return NextResponse.redirect(`${base}/login?error=missing_token`);
  }

  // Verify magic token
  const email = await verifyMagicToken(token);
  if (!email) {
    return NextResponse.redirect(`${base}/login?error=invalid_token`);
  }

  // Re-check access in case allow-list changed since the token was issued
  const role = await checkEmailAccess(email);
  if (!role) {
    return NextResponse.redirect(`${base}/login?error=access_denied`);
  }

  // Create session
  const sessionToken = await createSessionToken(email, role);

  // Set cookie and redirect to compose page
  const res = NextResponse.redirect(`${base}/`);
  res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  return res;
}
