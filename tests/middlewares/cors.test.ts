import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { CORS } from '../../src/middlewares/cors';

describe('CORS', () => {
  describe('handle', () => {
    const next = mock(() => Promise.resolve(new Response('OK')));
    const origins = ['https://allowed.com', 'https://also-allowed.com'] as const;

    const endpoint = 'https://mocksmith-api.mcking.in/endpoints';
    const contextify = (overrides = {}) => ({
      req: new Request(endpoint), url: new URL(endpoint), params: {}, state: new Map(), ...overrides,
    });

    beforeEach(() => next.mockClear());

    test('should allow all origins by default', async () => {
      const middleware = new CORS();
      const context = contextify({ req: new Request(endpoint, { headers: { origin: origins[0] } }) });

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origins[0]);
    });

    test('should handle wildcard origin', async () => {
      const middleware = new CORS();
      const context = contextify({ req: new Request(endpoint, { headers: { origin: origins[1] } }) });

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origins[1]);
    });

    test('should handle allowed origins list', async () => {
      const middleware = new CORS({ origin: [...origins] });
      const context = contextify({ req: new Request(endpoint, { headers: { origin: origins[0] } }) });

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origins[0]);
    });

    test('should reject origin not in allowed list', async () => {
      const middleware = new CORS({ origin: [origins[0]] });
      const context = contextify({ req: new Request(endpoint, { headers: { origin: 'https://not-allowed.com' } }) });

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('');
    });

    test('should handle preflight OPTIONS request', async () => {
      const middleware = new CORS();
      const context = contextify({ req: new Request(endpoint, { method: 'OPTIONS', headers: { origin: origins[0] } }) });

      const response = await middleware.handle(context, next);

      expect(next).not.toHaveBeenCalled();
      expect(response.status).toBe(204);
    });

    test('should add allow methods header', async () => {
      const middleware = new CORS();
      const context = contextify();

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });

    test('should add allow headers header', async () => {
      const middleware = new CORS();
      const context = contextify();

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });

    test('should allow custom methods', async () => {
      const middleware = new CORS({ methods: ['GET', 'POST'] });
      const context = contextify();

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
    });

    test('should allow custom headers', async () => {
      const middleware = new CORS({ headers: 'content-type, x-custom-header' });
      const context = contextify();

      const response = await middleware.handle(context, next);
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('content-type, x-custom-header');
    });
  });
});
