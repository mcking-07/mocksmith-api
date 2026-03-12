import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { Router } from '../../src/routes/router';
import { NotFound } from '../../src/errors';

describe('Router', () => {
  const handler = mock(async () => new Response('OK'));
  const next = mock(() => Promise.resolve(new Response('OK')));

  const url = 'https://mocksmith-api.mcking.in';
  const requestify = (path: string, options = {}) => new Request(`${url}${path}`, options);

  beforeEach(() => {
    next.mockClear();
    handler.mockClear();
  });

  describe('routes', () => {
    test('should register a route with method, path, and handler', async () => {
      const router = new Router();
      router.route('GET', '/api/test', handler);

      const response = await router.handle(requestify('/api/test'));

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('should normalize route methods to uppercase', async () => {
      const router = new Router();
      router.route('get', '/api/test', handler);

      await router.handle(requestify('/api/test'));
      expect(handler).toHaveBeenCalled();
    });

    test('should match routes registered with wildcard methods', async () => {
      const router = new Router();
      router.route('*', '/api/wildcard', handler);

      const get_response = await router.handle(requestify('/api/wildcard', { method: 'GET' }));
      const post_response = await router.handle(requestify('/api/wildcard', { method: 'POST' }));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(get_response.status).toBe(200);
      expect(post_response.status).toBe(200);
    });
  });

  describe('middlewares', () => {
    test('should register and apply global middleware', async () => {
      const middleware = {
        handle: mock(async (context, next) => {
          context.state.set('middleware', 'ran');
          return next();
        })
      };

      const handler = mock(async (context) => new Response(context.state.get('middleware')));

      const router = new Router();
      router.use(middleware);
      router.route('GET', '/api/test', handler);

      const response = await router.handle(requestify('/api/test'));
      const text = await response.text();

      expect(middleware.handle).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      expect(text).toBe('ran');
    });

    test('should skip specified middleware for a route', async () => {
      class Middleware {
        handle = mock(async (_context, next) => next());
      }

      const middleware = new Middleware();
      const router = new Router();

      router.use(middleware);
      router.route('GET', '/api/test', handler, { skip: [Middleware] });

      const response = await router.handle(requestify('/api/test'));

      expect(middleware.handle).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('should apply route-specific middleware before the route handler', async () => {
      const middleware = {
        handle: mock(async (context, next) => {
          context.state.set('route_middleware', 'ran');
          return next();
        })
      };

      const handler = mock(async (context) => {
        return new Response(context.state.get('route_middleware'));
      });

      const router = new Router();
      router.route('GET', '/api/test', handler, { middleware: [middleware] });

      const response = await router.handle(requestify('/api/test'));
      const text = await response.text();

      expect(middleware.handle).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      expect(text).toBe('ran');
    });

    test('should execute multiple middleware in registration order', async () => {
      const first_middleware = {
        handle: mock(async (context, next) => {
          context.state.set('order', `${context.state.get('order') ?? ''}1`);
          return next();
        })
      };

      const second_middleware = {
        handle: mock(async (context, next) => {
          context.state.set('order', `${context.state.get('order') ?? ''}2`);
          return next();
        })
      };

      const handler = mock(async (context) => new Response(context.state.get('order')));

      const router = new Router();
      router.use(first_middleware);
      router.use(second_middleware);
      router.route('GET', '/api/test', handler);

      const response = await router.handle(requestify('/api/test'));
      const text = await response.text();

      expect(first_middleware.handle).toHaveBeenCalled();
      expect(second_middleware.handle).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      expect(text).toBe('12');
    });
  });

  describe('handler', () => {
    test('should extract path parameters from the request url', async () => {
      const router = new Router();

      const single_param_handler = mock(async (context) => new Response(context.params.id));
      router.route('GET', '/api/users/:id', single_param_handler);

      const single_response = await router.handle(requestify('/api/users/1234'));
      const single_text = await single_response.text();

      expect(single_param_handler).toHaveBeenCalled();
      expect(single_text).toBe('1234');

      const multi_param_handler = mock(async (context) => new Response(`${context.params.userId}/${context.params.postId}`));
      router.route('GET', '/api/users/:userId/posts/:postId', multi_param_handler);

      const multi_response = await router.handle(requestify('/api/users/123/posts/456'));
      const multi_text = await multi_response.text();

      expect(multi_param_handler).toHaveBeenCalled();
      expect(multi_text).toBe('123/456');
    });

    test('should throw not found when no matching route exists', async () => {
      const router = new Router();
      expect(router.handle(requestify('/api/nonexistent'))).rejects.toThrowError(NotFound);
    });
  });
});
