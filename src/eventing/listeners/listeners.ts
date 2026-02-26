import type { ListenerType } from '../../types';

class EventListener {
  private readonly listeners: ListenerType[];
  constructor() {
    this.listeners = [];
  }

  initialize = () => {
    this.listeners.forEach(listener => listener.register());
  };
}

const listeners = new EventListener();

export { listeners };
