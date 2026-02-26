import { loggerFor } from '../common';
import { config } from '../config';
import { AnalyticsRepository, Database, EndpointsRepository } from '../database';
import { ServiceNotRegistered } from '../errors';
import { AnalyticsService } from './analytics';
import { EndpointsService } from './endpoints';
import { HealthService } from './healthcheck';
import { SandboxService } from './sandbox';

const logger = loggerFor(import.meta.url);

type Registry = {
  'database': Database;
  'database:endpoints': EndpointsRepository;
  'database:analytics': AnalyticsRepository;
  'service:endpoints': EndpointsService;
  'service:healthcheck': HealthService;
  'service:analytics': AnalyticsService;
  'service:sandbox': SandboxService;
};

class ServiceRegistry {
  private services: Map<string, Registry[keyof Registry]>;
  constructor() {
    this.services = new Map();
  }

  register = <Key extends keyof Registry>(name: Key, instance: Registry[Key]) => {
    if (this.services.has(name)) {
      logger.warn(`[-] service [${name}] is already registered.`);
    }

    this.services.set(name, instance);
  };

  resolve = <Key extends keyof Registry>(name: Key) => {
    const service = this.services.get(name);
    if (!service) throw new ServiceNotRegistered(`service [${name}] is not registered`, { service: name });

    return service as Registry[Key];
  };

  reset = () => {
    this.services.clear();
  };
}

const services = new ServiceRegistry();

services.register('database', new Database(config?.database?.path));
services.register('database:analytics', new AnalyticsRepository(services.resolve('database')));
services.register('database:endpoints', new EndpointsRepository(services.resolve('database')));

services.register('service:sandbox', new SandboxService());

services.register('service:analytics', new AnalyticsService(services.resolve('database:analytics')));
services.register('service:endpoints', new EndpointsService(services.resolve('database:endpoints'), services.resolve('service:sandbox')));
services.register('service:healthcheck', new HealthService(services.resolve('database')));


export { services };