import type { Context, CorsOptions, Middleware, NextFunction } from '../types';

class CORS implements Middleware {
  private readonly options: CorsOptions;
  constructor(options: CorsOptions = {}) {
    this.options = {
      origin: options?.origin ?? '*',
      methods: options?.methods ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: options?.headers ?? 'content-type, authorization'
    };
  }

  private is_origin_allowed = (origin: string) => {
    if (this.options.origin === '*') return true;

    if (Array.isArray(this.options.origin)) {
      return this.options.origin.includes(origin);
    }

    return this.options.origin === origin;
  };

  private headers = (origin: string) => {
    const headers = new Headers();

    headers.set('Access-Control-Allow-Origin', this.is_origin_allowed(origin) ? origin : '');
    headers.set('Access-Control-Allow-Methods', this.options.methods?.join(', ') ?? '');
    headers.set('Access-Control-Allow-Headers', this.options.headers ?? '');

    return headers;
  };

  handle = async (context: Context, next: NextFunction) => {
    const origin = context?.req?.headers?.get('origin') ?? '';
    const is_preflight = context?.req?.method === 'OPTIONS';

    const headers = this.headers(origin);
    if (is_preflight) return new Response(null, { status: 204, headers });

    const response = await next();
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value);
    }

    return response;
  };
}

export { CORS };
