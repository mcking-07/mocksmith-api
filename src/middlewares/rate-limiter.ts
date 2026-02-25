import { RateLimited } from '../errors';
import type { Context, Middleware, NextFunction, RateLimitRecord, RateLimiterOptions } from '../types';

class RateLimiter implements Middleware {
  private readonly window_in_milliseconds: number;
  private readonly maximum_requests: number;
  private readonly store: Map<string, RateLimitRecord>;
  constructor(options: RateLimiterOptions = {}) {
    this.window_in_milliseconds = options?.window_in_milliseconds ?? 60000;
    this.maximum_requests = options?.maximum_requests ?? 100;
    this.store = new Map();
  }

  private headers = (bucket: RateLimitRecord) => {
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', this.maximum_requests.toString());
    headers.set('X-RateLimit-Remaining', bucket.tokens.toString());
    return headers;
  };

  private extract_ip = (context: Context) => {
    return (context?.req?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? context?.req?.headers?.get('x-real-ip')) ?? 'anonymous';
  };

  handle = async (context: Context, next: NextFunction) => {
    const ip_address = this.extract_ip(context);
    const timestamp = Date.now();

    const stored = this.store.get(ip_address) ?? { tokens: this.maximum_requests, refilled_at: timestamp };

    const time_since_refill = timestamp - stored.refilled_at;
    const tokens_to_refill = Math.floor((time_since_refill / this.window_in_milliseconds) * this.maximum_requests);

    const bucket = { tokens: Math.min(this.maximum_requests, stored.tokens + tokens_to_refill), refilled_at: timestamp };
    if (bucket.tokens <= 0) {
      throw new RateLimited('rate limit exceeded. please try again later.', { retry_after: this.window_in_milliseconds - time_since_refill });
    }

    bucket.tokens -= 1;
    this.store.set(ip_address, bucket);

    const response = await next();
    const headers = this.headers(bucket);

    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value);
    }

    return response;
  };
}

export { RateLimiter };
