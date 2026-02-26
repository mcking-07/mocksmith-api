import type { ListenerType } from '../../types';
import { AnalyticsListener } from './analytics';

class EventListener {
  private readonly listeners: ListenerType[];
  constructor() {
    this.listeners = [new AnalyticsListener()];
  }

  initialize = () => {
    this.listeners.forEach(listener => listener.register());
  };
}

const listeners = new EventListener();

export { listeners };
