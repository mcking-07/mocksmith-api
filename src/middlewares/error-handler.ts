import { loggerFor } from '../common';
import type { Context, ErrorCode, Middleware, NextFunction } from '../types';
import { BaseError } from '../errors';

const logger = loggerFor(import.meta.url);

class ErrorHandler implements Middleware {
  private readonly http_status_codes: Map<ErrorCode, number>;
  constructor() {
    this.http_status_codes = new Map([
      ['UNAUTHORIZED', 401],
      ['RATE_LIMITED', 429],
      ['BAD_REQUEST', 400],
      ['NOT_FOUND', 404],
      ['VALIDATION_FAILED', 422],
      ['CONFLICT', 409],
      ['SERVICE_NOT_REGISTERED', 500],
      ['PERSISTENCE_FAILED', 500],
      ['HANDLER_EXECUTION_FAILED', 500],
      ['INTERNAL_ERROR', 500]
    ]);
  }

  private transformed = async (error: unknown, context: Context) => {
    const request_id = context?.id ?? 'no-request-id';
    logger.error('an error occurred:', error);

    const headers = { 'content-type': 'application/json', 'x-request-id': request_id };
    if (error instanceof BaseError) {
      const status = this.http_status_codes.get(error?.code) ?? 500;
      const { code, message, payload: details } = error;

      const payload = { code, message, ...(Object.keys(details)?.length > 0 && { details }), request_id };
      return new Response(JSON.stringify(payload), { status, headers });
    }

    const payload = { code: 'INTERNAL_ERROR', message: 'Internal Server Error', request_id };
    return new Response(JSON.stringify(payload), { status: 500, headers });
  };

  handle = async (context: Context, next: NextFunction) => {
    return await next().catch((error) => this.transformed(error, context));
  };
}

export { ErrorHandler };
