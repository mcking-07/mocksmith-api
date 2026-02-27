import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class HandlerExecutionFailed extends BaseError {
  constructor(message: string, payload: ErrorPayload = {}) {
    super(message, 'HANDLER_EXECUTION_FAILED', payload);
  }
}

export { HandlerExecutionFailed };