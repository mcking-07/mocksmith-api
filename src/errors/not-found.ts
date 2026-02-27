import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class NotFound extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'NOT_FOUND', payload);
  }
}

export { NotFound };
