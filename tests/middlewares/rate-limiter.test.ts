import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { RateLimiter } from '../../src/middlewares/rate-limiter';
import { RateLimited } from '../../src/errors';

describe('RateLimiter', () => {
  describe('handler', () => {
    const next = mock(() => Promise.resolve(new Response('OK')));

    const endpoint = 'https://mocksmith-api.mcking.in/endpoints';
    const headers = { 'x-forwarded-for': '1.1.1.1' };

    const contextify = (overrides = {}) => ({
      req: new Request(endpoint, { headers }), url: new URL(endpoint), params: {}, state: new Map(), ...overrides,
    });

    beforeEach(() => next.mockClear());

    test('should allow requests under the limit', async () => {
      const middleware = new RateLimiter({ maximum_requests: 10 });
      const context = contextify();

      await middleware.handle(context, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('should block requests over the limit', async () => {
      const middleware = new RateLimiter({ maximum_requests: 1, window_in_milliseconds: 60000 });
      const context = contextify();

      await middleware.handle(context, next);

      expect(middleware.handle(context, next)).rejects.toThrowError(RateLimited);
      expect(middleware.handle(context, next)).rejects.toThrow('rate limit exceeded. please try again later.');
    });

    test('should maintain separate rate limits for different ip addresses', async () => {
      const middleware = new RateLimiter({ maximum_requests: 1 });

      const first_context = contextify({ req: new Request(endpoint, { headers: { 'x-forwarded-for': '1.1.1.1' } }) });
      const second_context = contextify({ req: new Request(endpoint, { headers: { 'x-forwarded-for': '8.8.8.8' } }) });

      await middleware.handle(first_context, next);
      await middleware.handle(second_context, next);

      expect(next).toHaveBeenCalledTimes(2);
    });

    test('should fall back to x-real-ip or anonymous when x-forwarded-for is missing', async () => {
      const middleware = new RateLimiter({ maximum_requests: 10 });

      const real_ip_context = contextify({ req: new Request(endpoint, { headers: { 'x-real-ip': '8.8.8.8' } }) });
      const anonymous_context = contextify({ req: new Request(endpoint) });

      await middleware.handle(real_ip_context, next);
      await middleware.handle(anonymous_context, next);

      expect(next).toHaveBeenCalledTimes(2);
    });

    test('should add rate limit headers to the response', async () => {
      const middleware = new RateLimiter({ maximum_requests: 10 });
      const context = contextify();

      const response = await middleware.handle(context, next);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
    });

    test('should decrement remaining tokens after each request', async () => {
      const middleware = new RateLimiter({ maximum_requests: 2 });
      const context = contextify();

      const first = await middleware.handle(context, next);
      const second = await middleware.handle(context, next);

      expect(first.headers.get('X-RateLimit-Remaining')).toBe('1');
      expect(second.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    test('should preserve existing response headers', async () => {
      const middleware = new RateLimiter({ maximum_requests: 10 });
      const response = new Response('OK', { headers: { 'content-type': 'application/json' } });

      const next = mock(() => Promise.resolve(response));
      const context = contextify();

      const result = await middleware.handle(context, next);
      expect(result.headers.get('content-type')).toBe('application/json');
    });
  });
});