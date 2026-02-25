import type { Context, Middleware, NextFunction, Parsers } from '../types';

const DEFAULT_PARSERS: Parsers = {
  'application/json': (req) => req.json(),
  'text/plain': (req) => req.text(),
  'application/x-www-form-urlencoded': async (req) => Object.fromEntries(new URLSearchParams(await req.text())),
};

class BodyParser implements Middleware {
  private readonly parsers: Parsers;
  constructor(parsers: Parsers = {}) {
    this.parsers = { ...DEFAULT_PARSERS, ...parsers };
  }

  handle = async (context: Context, next: NextFunction) => {
    if (['GET', 'HEAD'].includes(context?.req?.method)) return next();

    const content_type = context?.req?.headers?.get('content-type') ?? '';
    if (!content_type) return next();

    const [mime_part] = content_type.split(';');
    const mime = mime_part?.trim()?.toLowerCase() ?? '';

    const parser = this.parsers[mime];
    if (!parser) return next();

    context.body = await parser(context.req);
    return next();
  };
}

export { BodyParser };
