import { describe, expect, mock, test } from 'bun:test';
import { ErrorHandler } from '../../src/middlewares/error-handler';
import { BadRequest, NotFound, Unauthorized, ValidationFailed, Conflict } from '../../src/errors';

describe('ErrorHandler', () => {
  describe('handler', () => {
    const endpoint = 'https://mocksmith-api.mcking.in/endpoints';
    const contextify = (overrides = {}) => ({
      req: new Request(endpoint), url: new URL(endpoint), params: {}, state: new Map(), id: 'test-request-id', ...overrides,
    });
    const nextify = (error: Error) => mock(() => Promise.reject(error));

    test('should pass through successful responses', async () => {
      const next = mock(() => Promise.resolve(new Response('OK')));
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test('should handle Unauthorized error', async () => {
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, nextify(new Unauthorized('Unauthorized Access')));
      const body = await response.json() as { code: string; message: string; };

      expect(response.status).toBe(401);
      expect(body?.code).toBe('UNAUTHORIZED');
      expect(body?.message).toBe('Unauthorized Access');
    });

    test('should handle NotFound error', async () => {
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, nextify(new NotFound('Resource Not Found')));
      const body = await response.json() as { code: string; message: string; };

      expect(response.status).toBe(404);
      expect(body?.code).toBe('NOT_FOUND');
    });

    test('should handle ValidationFailed error', async () => {
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, nextify(new ValidationFailed('Invalid Input', { field: 'name' })));
      const body = await response.json() as { code: string; message: string; details: { field: string; }; };

      expect(response.status).toBe(422);
      expect(body.code).toBe('VALIDATION_FAILED');
      expect(body.details.field).toBe('name');
    });

    test('should handle Conflict error', async () => {
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, nextify(new Conflict('Resource Already Exists')));
      const body = await response.json() as { code: string; message: string; };

      expect(response.status).toBe(409);
      expect(body.code).toBe('CONFLICT');
    });

    test('should handle unknown errors as internal error', async () => {
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, nextify(new Error('Unknown Error')));
      const body = await response.json() as { code: string; message: string; };

      expect(response.status).toBe(500);
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    test('should include request_id in response', async () => {
      const middleware = new ErrorHandler();
      const context = contextify({ id: 'custom-request-id' });

      const response = await middleware.handle(context, nextify(new NotFound('Not Found')));
      const body = await response.json() as { code: string; message: string; request_id: string; };

      expect(body.request_id).toBe('custom-request-id');
      expect(response.headers.get('x-request-id')).toBe('custom-request-id');
    });

    test('should include content-type header', async () => {
      const middleware = new ErrorHandler();
      const context = contextify();

      const response = await middleware.handle(context, nextify(new BadRequest('Bad Request')));
      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });
});
