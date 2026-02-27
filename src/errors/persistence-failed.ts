import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class PersistenceFailed extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'PERSISTENCE_FAILED', payload);
  }
}

export { PersistenceFailed };
