import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class Conflict extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'CONFLICT', payload);
  }
}

export { Conflict };
