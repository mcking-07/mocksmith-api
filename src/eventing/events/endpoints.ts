import type { EndpointEventPayload } from '../../types';
import { BaseEvent } from './base';

class EndpointEvent<PayloadType = EndpointEventPayload> extends BaseEvent<PayloadType> {
  constructor(name: string, payload: PayloadType) {
    super(name, { ...payload, category: 'endpoints' });
  }
}

class EndpointCreated extends EndpointEvent {
  constructor(payload: EndpointCreated['payload']) {
    super(EndpointCreated.name, payload);
  }
}

class EndpointRequested extends EndpointEvent {
  constructor(payload: EndpointRequested['payload']) {
    super(EndpointRequested.name, payload);
  }
}

class EndpointUpdated extends EndpointEvent {
  constructor(payload: EndpointUpdated['payload']) {
    super(EndpointUpdated.name, payload);
  }
}

class EndpointDeleted extends EndpointEvent {
  constructor(payload: EndpointDeleted['payload']) {
    super(EndpointDeleted.name, payload);
  }
}

export { EndpointCreated, EndpointRequested, EndpointUpdated, EndpointDeleted };
