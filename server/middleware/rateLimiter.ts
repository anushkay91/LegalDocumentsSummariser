import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  endpointName?: string;
  message?: string;
}

interface RequestRecord {
  timestamps: number[];
}

const rateLimitBuckets = new Map<string, RequestRecord>();

// Cleanup stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitBuckets.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < 3600000);
    if (record.timestamps.length === 0) {
      rateLimitBuckets.delete(key);
    }
  }
}, 300000);

/**
 * Creates per-user (or per-IP) sliding-window rate limit middleware.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const endpointName = config.endpointName || 'endpoint';
  const customMessage = config.message || `Rate limit exceeded for ${endpointName}. Maximum ${config.maxRequests} requests per ${Math.round(config.windowMs / 1000)}s.`;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Key by verified user UID if authenticated, or client IP
    const identifier = req.user?.uid || req.ip || 'anonymous-client';
    const bucketKey = `${endpointName}:${identifier}`;
    const now = Date.now();

    let record = rateLimitBuckets.get(bucketKey);
    if (!record) {
      record = { timestamps: [] };
      rateLimitBuckets.set(bucketKey, record);
    }

    // Filter out timestamps outside the current window
    record.timestamps = record.timestamps.filter(ts => now - ts < config.windowMs);

    if (record.timestamps.length >= config.maxRequests) {
      const oldest = record.timestamps[0];
      const resetTime = Math.ceil((oldest + config.windowMs - now) / 1000);
      res.setHeader('Retry-After', resetTime);
      res.status(429).json({
        error: customMessage,
        retryAfterSeconds: resetTime,
      });
      return;
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - record.timestamps.length));
    next();
  };
}

export const rateLimiter = createRateLimiter;

// Pre-configured rate limiters
export const documentProcessLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  endpointName: 'document-processing',
});

export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  endpointName: 'rag-chat',
});
