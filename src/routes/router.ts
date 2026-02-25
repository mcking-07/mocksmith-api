import { match } from 'path-to-regexp';
import { NotFound } from '../errors';
import type { Context, Handler, Middleware, NextFunction, Route, RouteOptions } from '../types';

class Router {
  private readonly middlewares: Middleware[];
  private readonly routes: Route[];
  constructor() {
    this.middlewares = [];
    this.routes = [];
  }

  route = (method: string, path: string, handler: Handler, options?: RouteOptions) => {
    this.routes.push({ method: method?.toUpperCase(), path, matcher: match(path), handler, options });
  };

  use = (middleware: Middleware) => {
    this.middlewares.push(middleware);
  };

  private compose = (middlewares: Middleware[], handler: Handler) => {
    return (context: Context) => {
      const chain = [...middlewares].reverse().reduce<NextFunction>((next, middleware) => () => middleware.handle(context, next), () => handler(context));
      return chain();
    };
  };

  handle = async (req: Request) => {
    const url = new URL(req?.url);

    const route = this.routes.find(current => (req?.method === current?.method || current?.method === '*') && current?.matcher(url?.pathname));
    if (!route) {
      throw new NotFound(`no route found for method ${req?.method} and path ${url?.pathname}`, { invalid: { method: req?.method, path: url?.pathname } });
    }

    const matched = route.matcher(url?.pathname);
    if (!matched) {
      throw new NotFound(`no route found for method ${req?.method} and path ${url?.pathname}`, { invalid: { method: req?.method, path: url?.pathname } });
    }

    const context: Context = { req, url, params: matched.params, state: new Map() };
    const { options: { skip = [], middleware = [] } = {} } = route;

    const middlewares = this.middlewares.filter(middleware => !skip.some(current => middleware?.constructor === current)).concat(middleware);
    const handler = this.compose(middlewares, route.handler);

    return handler(context);
  };
}

export { Router };
