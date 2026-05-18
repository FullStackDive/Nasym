import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// In-memory fixed-window limiter. Per-instance only; on serverless this is
// best-effort. Upgrade to Redis (Upstash) once abuse is a real concern.
// ---------------------------------------------------------------------------
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function hit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) {
      const target = buckets.size - MAX_KEYS;
      let i = 0;
      for (const k of buckets.keys()) {
        buckets.delete(k);
        if (++i >= target) break;
      }
    }
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { ok: true };
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function tierFor(pathname: string, method: string): { limit: number; windowMs: number } {
  if (pathname.startsWith("/api/auth/forgot") || pathname.startsWith("/api/auth/reset")) {
    return { limit: 5, windowMs: 15 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/auth/callback/credentials")) {
    return { limit: 10, windowMs: 5 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/register")) {
    return { limit: 5, windowMs: 60 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/ask")) {
    return { limit: 10, windowMs: 10 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/upload")) {
    return { limit: 20, windowMs: 10 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/reports")) {
    return { limit: 15, windowMs: 10 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/live/") && method !== "GET") {
    return { limit: 120, windowMs: 60 * 1000 };
  }
  if (pathname.startsWith("/api/admin")) {
    return { limit: 300, windowMs: 60 * 1000 };
  }
  if (method !== "GET" && method !== "HEAD") {
    return { limit: 60, windowMs: 60 * 1000 };
  }
  return { limit: 300, windowMs: 60 * 1000 };
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "on");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=(), interest-cohort=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

// ---------------------------------------------------------------------------
// Page-level role guards (kept identical to the previous withAuth config).
// ---------------------------------------------------------------------------
const GUARDED_PREFIXES = ["/admin", "/teach", "/parent", "/dashboard", "/classroom", "/live", "/profile", "/reminders", "/reports"];

const PAGE_KEY_BY_PREFIX: Array<[string, string]> = [
  ["/dashboard", "dashboard"],
  ["/classes", "classes"],
  ["/lessons", "lessons"],
  ["/news", "news"],
];

function roleOk(pathname: string, role: unknown): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/teach")) return role === "TEACHER" || role === "ADMIN";
  if (pathname.startsWith("/parent")) return role === "PARENT" || role === "ADMIN";
  return true;
}

function pageHidden(pathname: string, hiddenPages: unknown): boolean {
  if (!Array.isArray(hiddenPages) || hiddenPages.length === 0) return false;
  for (const [prefix, key] of PAGE_KEY_BY_PREFIX) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return hiddenPages.includes(key);
    }
  }
  return false;
}

function redirectToSignin(req: NextRequest): NextResponse {
  const url = new URL("/auth/signin", req.url);
  url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export default async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Junk probes — drop early.
  if (pathname.startsWith("/wp-") || pathname.startsWith("/.env") || pathname.endsWith(".php")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // API: rate-limit only (auth is enforced inside each route).
  if (pathname.startsWith("/api/")) {
    // Skip NextAuth's session/csrf probes — they fire on every page nav.
    const skip =
      pathname === "/api/auth/session" ||
      pathname === "/api/auth/_log" ||
      pathname === "/api/auth/csrf" ||
      pathname === "/api/auth/providers";
    if (!skip) {
      const ip = clientIp(req);
      const tier = tierFor(pathname, req.method);
      const prefix = pathname.split("/").slice(0, 4).join("/");
      const r = hit(`${ip}:${prefix}:${req.method}`, tier.limit, tier.windowMs);
      if (!r.ok) {
        const res = NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": String(r.retryAfter) } }
        );
        return withSecurityHeaders(res);
      }
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // Page-level role guard
  if (GUARDED_PREFIXES.some(p => pathname.startsWith(p))) {
    const token = await getToken({ req });
    if (!token) return withSecurityHeaders(redirectToSignin(req));
    if (!roleOk(pathname, token.role)) return withSecurityHeaders(redirectToSignin(req));
    if (pageHidden(pathname, token.hiddenPages)) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
    }
  } else {
    // Hidden-page guard for non-guarded prefixes (classes, lessons, news).
    if (PAGE_KEY_BY_PREFIX.some(([p]) => pathname === p || pathname.startsWith(p + "/"))) {
      const token = await getToken({ req });
      if (token && pageHidden(pathname, token.hiddenPages)) {
        return withSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
      }
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
