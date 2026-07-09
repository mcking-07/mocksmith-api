import { SignJWT } from 'jose';
import { beforeEach, describe, expect, vi, test } from 'vitest';
import { Unauthorized } from '../../src/errors';
import { Authentication } from '../../src/middlewares/authentication';

const SECRET = 'test-secret-key-for-authentication';

const create_token = async (payload: Record<string, unknown> = { user: 'test-user' }) => {
  const secret = new TextEncoder().encode(SECRET);
  return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(secret);
};

describe('Authentication', () => {
  describe('handler', () => {
    const next = vi.fn(() => Promise.resolve(new Response('OK')));
    const endpoint = 'https://mocksmith-api.mcking.in/endpoints';

    const contextify = (overrides = {}) => ({
      req: new Request(endpoint), url: new URL(endpoint), params: {}, state: new Map(), ...overrides,
    });

    beforeEach(() => next.mockClear());

    test('should skip authentication when disabled', async () => {
      const middleware = new Authentication({ enabled: false });
      const context = contextify();

      await middleware.handle(context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(context?.state?.get('user')).toBeUndefined();
    });

    test('should throw an error when bearer token is missing', async () => {
      const middleware = new Authentication({ enabled: true, secret: SECRET });
      const context = contextify();

      await expect(middleware.handle(context, next)).rejects.toThrow(Unauthorized);
      await expect(middleware.handle(context, next)).rejects.toThrow('bearer token is missing');
    });

    test('should throw an error when bearer token is invalid', async () => {
      const middleware = new Authentication({ enabled: true, secret: SECRET });
      const context = contextify({ req: new Request(endpoint, { headers: { Authorization: 'Bearer InvalidToken' } }) });

      await expect(middleware.handle(context, next)).rejects.toThrow(Unauthorized);
      await expect(middleware.handle(context, next)).rejects.toThrow('invalid or expired token');
    });

    test('should throw an error when misconfigured (no secret)', async () => {
      const middleware = new Authentication({ enabled: true });
      const context = contextify({ req: new Request(endpoint, { headers: { Authorization: 'Bearer Token' } }) });

      await expect(middleware.handle(context, next)).rejects.toThrow(Unauthorized);
      await expect(middleware.handle(context, next)).rejects.toThrow('authentication misconfigured');
    });

    test('should allow valid bearer tokens', async () => {
      const token = await create_token();
      const middleware = new Authentication({ enabled: true, secret: SECRET });
      const context = contextify({ req: new Request(endpoint, { headers: { Authorization: `Bearer ${token}` } }) });

      await middleware.handle(context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(context?.state?.get('user')).toBeDefined();
    });
  });
});
