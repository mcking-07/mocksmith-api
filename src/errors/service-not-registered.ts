import type { ErrorPayload } from '../types';
import { BaseError } from './base-error';

class ServiceNotRegistered extends BaseError {
  constructor(message: string, payload?: ErrorPayload) {
    super(message, 'SERVICE_NOT_REGISTERED', payload);
  }
}

export { ServiceNotRegistered };
