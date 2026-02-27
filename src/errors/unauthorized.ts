import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class Unauthorized extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'UNAUTHORIZED', payload);
  }
}

export { Unauthorized };
