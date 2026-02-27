import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class ValidationFailed extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'VALIDATION_FAILED', payload);
  }
}

export { ValidationFailed };
