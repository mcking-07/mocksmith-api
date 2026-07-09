import { async_store } from '../common';
import type { Context, Middleware, NextFunction } from '../types';

class RequestContext implements Middleware {
  handle = async (context: Context, next: NextFunction) => {
    const request_id = context?.req?.headers?.get('x-request-id') ?? crypto.randomUUID();
    context.id = request_id;

    return async_store.run({ request_id }, () => next());
  };
}

export { RequestContext };
