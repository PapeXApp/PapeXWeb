// lib/server/signup/rateLimit.ts
//
// Fixed-window, per-key (per-IP) request limiter held in memory.
//
// Serverless caveat: on Vercel every function instance has its own memory,
// instances are recycled, and a burst can fan out across several of them. So
// this is a speed bump against a single noisy client hitting a warm
// instance, NOT a guarantee. A real cap would need a shared store (e.g.
// Upstash/Vercel KV) or Vercel's WAF rate-limit rules in front of the route.

export interface RateLimitDecision {
  allowed: boolean;
  /** Whole seconds until the window resets (0 when allowed). */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): RateLimitDecision;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
  /** Past this many tracked keys, expired entries are swept (bounds memory). */
  maxKeys?: number;
}

export function createRateLimiter({ limit, windowMs, now = Date.now, maxKeys = 10_000 }: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  function sweep(t: number) {
    for (const [key, w] of windows) if (t - w.start >= windowMs) windows.delete(key);
    // Still over (a flood of distinct keys inside one window): drop the oldest.
    while (windows.size > maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest === undefined) break;
      windows.delete(oldest);
    }
  }

  return {
    check(key: string): RateLimitDecision {
      const t = now();
      let w = windows.get(key);
      if (!w || t - w.start >= windowMs) {
        if (w) windows.delete(key);
        if (windows.size >= maxKeys) sweep(t);
        w = { start: t, count: 0 };
        windows.set(key, w);
      }
      w.count += 1;
      if (w.count <= limit) return { allowed: true, retryAfterSeconds: 0 };
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((w.start + windowMs - t) / 1000)) };
    },
  };
}

/** 6 submissions per IP per 10 minutes: generous for people, tight for scripts. */
export const SIGNUP_RATE_LIMIT = { limit: 6, windowMs: 10 * 60 * 1000 } as const;

/**
 * Client IP from the proxy headers. On Vercel, `x-forwarded-for` /
 * `x-real-ip` are set by the platform edge (client-supplied values are
 * overwritten), so the first entry is the caller.
 */
export function clientIpFromHeaders(get: (name: string) => string | null): string {
  const forwarded = get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || get("x-real-ip")?.trim() || "";
  // Keep the key short and boring whatever the header holds.
  return ip.slice(0, 64) || "unknown";
}
