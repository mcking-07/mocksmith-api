import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class RateLimited extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'RATE_LIMITED', payload);
  }
}

export { RateLimited };
