import { AsyncLocalStorage } from 'node:async_hooks';
import type { ContextStore } from '../types';

const async_store = new AsyncLocalStorage<ContextStore>();

export { async_store };
