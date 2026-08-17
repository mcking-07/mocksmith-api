import type { ListenerType } from '../../types';
import { AnalyticsListener } from './analytics';

class EventListener {
  private readonly listeners: ListenerType[];
  private initialized: boolean;
  constructor() {
    this.listeners = [new AnalyticsListener()];
    this.initialized = false;
  }

  initialize = () => {
    if (this.initialized) return;

    this.listeners.forEach(listener => listener.register());
    this.initialized = true;
  };
}

const listeners = new EventListener();

export { listeners };
