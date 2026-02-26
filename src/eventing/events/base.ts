import { randomUUIDv7 } from 'bun';
import type { BaseEventPayload } from '../../types';

class BaseEvent<PayloadType = BaseEventPayload> {
  readonly id: string;
  readonly name: string;
  readonly payload: PayloadType;
  readonly timestamp: number;
  constructor(name: string, payload: PayloadType) {
    this.id = randomUUIDv7();
    this.name = name;
    this.payload = payload;
    this.timestamp = Date.now();
  }
}

export { BaseEvent };
