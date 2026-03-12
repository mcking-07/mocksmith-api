import { EventEmitter } from 'node:events';
import { loggerFor, safe } from '../common';
import type { EventHandler } from '../types';
import type { BaseEvent } from './events';

const logger = loggerFor(import.meta.url);

const emitter = new EventEmitter();

class EventPublisher {
  static emit = <EventType extends BaseEvent>(event: EventType) => {
    logger.info(`publishing event ${event.name} with payload:`, event?.payload || {});
    return emitter.emit(event.name, event);
  };

  static on = <EventType extends BaseEvent>(event: string, listener: EventHandler<EventType>) => {
    logger.info(`registering event handler for event: ${event}`);
    return emitter.on(event, this.wrapped(listener));
  };

  static release = () => emitter.removeAllListeners();

  private static wrapped = <EventType extends BaseEvent>(handler: EventHandler<EventType>) => safe((event: EventType) => {
    logger.info(`received event ${event?.name || 'unknown'} for handler ${handler.name} with payload:`, event?.payload);
    return handler(event);
  });
}

export { EventPublisher };
