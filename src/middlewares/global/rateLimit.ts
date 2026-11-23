import { getConnInfo } from "@hono/node-server/conninfo";
import type { MiddlewareHandler } from "hono";
import { env } from "../../config/env.js";
import { RateLimitedError } from "../../errors/AppError.js";

const WINDOW_MS = 15 * 60 * 1000;

function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  if (env.TRUST_PROXY_HOPS > 0) {
    const forwarded = c.req
      .header("x-forwarded-for")
      ?.split(",")
      .map((ip) => ip.trim());
    if (forwarded?.length)
      return (
        forwarded[Math.max(0, forwarded.length - env.TRUST_PROXY_HOPS)] ||
        "unknown"
      );
  }
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function createRateLimiter(
  max: number,
  message: string,
): MiddlewareHandler {
  const windows = new Map<string, { count: number; reset: number }>();
  return async (c, next) => {
    if (env.RATE_LIMIT_DISABLED && env.NODE_ENV !== "production") {
      return next();
    }
    const now = Date.now();
    for (const [ip, window] of windows) {
      // New windows are appended and expire in insertion order.
      if (window.reset > now) break;
      windows.delete(ip);
    }
    const key = clientIp(c);
    let entry = windows.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + WINDOW_MS };
      windows.set(key, entry);
    }
    entry.count += 1;
    c.header("RateLimit-Limit", String(max));
    c.header("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    c.header("RateLimit-Reset", String(Math.ceil((entry.reset - now) / 1000)));
    if (entry.count > max) {
      c.header("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      throw new RateLimitedError(message);
    }
    await next();
  };
}

export const apiLimiter = createRateLimiter(
  100,
  "Too many requests from this IP. Try again later.",
);
