import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { Unauthorized } from '../../src/errors';
import { setup } from '../setup';

describe('Authentication', async () => {
  await setup();
  const { Authentication } = await import('../../src/middlewares/authentication');

  describe('handler', () => {
    const next = mock(() => Promise.resolve(new Response('OK')));
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
      const middleware = new Authentication({ enabled: true, secret: 'secret' });
      const context = contextify();

      expect(middleware.handle(context, next)).rejects.toThrowError(Unauthorized);
      expect(middleware.handle(context, next)).rejects.toThrow('bearer token is missing');
    });

    test('should throw an error when bearer token is invalid', async () => {
      const middleware = new Authentication({ enabled: true, secret: 'secret' });
      const context = contextify({ req: new Request(endpoint, { headers: { Authorization: 'Bearer Invalid' } }) });

      expect(middleware.handle(context, next)).rejects.toThrowError(Unauthorized);
      expect(middleware.handle(context, next)).rejects.toThrow('invalid or expired token');
    });

    test('should throw an error when misconfigured (no secret)', async () => {
      const middleware = new Authentication({ enabled: true });
      const context = contextify({ req: new Request(endpoint, { headers: { Authorization: 'Bearer Token' } }) });

      expect(middleware.handle(context, next)).rejects.toThrowError(Unauthorized);
      expect(middleware.handle(context, next)).rejects.toThrow('authentication misconfigured');
    });

    test('should allow valid bearer tokens', async () => {
      const middleware = new Authentication({ enabled: true, secret: 'secret' });
      const context = contextify({ req: new Request(endpoint, { headers: { Authorization: 'Bearer Valid' } }) });

      await middleware.handle(context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(context?.state?.get('user')).toBeDefined();
    });
  });
});
