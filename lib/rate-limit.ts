import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 5000;

function evictIfNeeded() {
  if (buckets.size <= MAX_KEYS) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
  if (buckets.size > MAX_KEYS) {
    const overflow = buckets.size - MAX_KEYS;
    let i = 0;
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (++i >= overflow) break;
    }
  }
}

function ipFromReq(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function clientKey(req: Request, prefix: string): string {
  return `${prefix}:${ipFromReq(req)}`;
}

/**
 * Build a key that's IP-scoped for anon traffic and userId-scoped for
 * authenticated traffic. Stops one shared NAT/VPN IP from starving everyone
 * behind it while still throttling drive-by anon abuse.
 */
export function actorKey(req: Request, prefix: string, userId?: string | null): string {
  if (userId) return `${prefix}:u:${userId}`;
  return `${prefix}:ip:${ipFromReq(req)}`;
}

/**
 * Fixed-window rate limiter. In-memory only — best-effort on serverless
 * (each instance has its own bucket map). Upgrade to Upstash Redis when
 * abuse becomes a real concern; this catches casual spam.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  evictIfNeeded();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
