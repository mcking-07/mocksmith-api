import { loggerFor } from '../common';
import type { Context, Middleware, NextFunction } from '../types';

const logger = loggerFor(import.meta.url);

class AccessLog implements Middleware {
  handle = async (context: Context, next: NextFunction) => {
    const start = performance.now();
    const { req: { method }, url: { pathname } } = context;

    const response = await next();
    const duration = Math.round(performance.now() - start);

    response.headers.set('x-request-id', context?.id ?? 'anonymous');
    logger.http(`${method} ${pathname} ${response.status} ${duration}ms`);

    return response;
  };
}

export { AccessLog };
