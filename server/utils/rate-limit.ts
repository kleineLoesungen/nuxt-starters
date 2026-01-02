/**
 * Rate limiting middleware
 * Tracks requests per IP/token and blocks excessive requests
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limit store (resets on server restart)
// For production, consider Redis or database storage
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute

/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (IP address or token hash)
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired, create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  // Increment counter
  entry.count++;

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  return true;
}

/**
 * Get rate limit info for a key
 */
export function getRateLimitInfo(key: string): {
  remaining: number;
  resetAt: number;
} {
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || entry.resetAt < now) {
    return {
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count),
    resetAt: entry.resetAt,
  };
}
