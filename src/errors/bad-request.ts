import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class BadRequest extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'BAD_REQUEST', payload);
  }
}

export { BadRequest };
