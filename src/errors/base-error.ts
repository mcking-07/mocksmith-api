import type { ErrorCode, ErrorPayload } from '../types';

class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly payload: ErrorPayload;
  constructor(message: string, code: ErrorCode, payload: ErrorPayload = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.payload = payload;
  }
}

export { BaseError };
