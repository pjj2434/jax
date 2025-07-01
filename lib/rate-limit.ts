// Simple in-memory rate limiting for free tier
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false; // Rate limited
  }
  
  // Increment count
  current.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute 