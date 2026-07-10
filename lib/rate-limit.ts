// Sliding-window rate limiter held in function memory. On Vercel each warm
// instance keeps its own window, which is sufficient to blunt abuse on the
// free tier without adding external infrastructure.

interface WindowEntry {
  timestamps: number[];
}

const windows = new Map<string, WindowEntry>();
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = windows.get(key) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  entry.timestamps.push(now);
  windows.set(key, entry);

  if (windows.size > MAX_TRACKED_KEYS) {
    const cutoff = now - windowMs;
    for (const [trackedKey, tracked] of windows) {
      if (tracked.timestamps.every((timestamp) => timestamp < cutoff)) {
        windows.delete(trackedKey);
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { error: "Too many requests. Please slow down and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
