import { loggerFor } from '../common';
import { config } from '../config';
import { AnalyticsRepository, Database, EndpointsRepository } from '../database';
import { ServiceNotRegistered } from '../errors';
import type { EnvironmentType } from '../types';
import { AnalyticsService } from './analytics';
import { EndpointsService } from './endpoints';
import { HealthService } from './healthcheck';
import { SandboxService } from './sandbox';

const logger = loggerFor('services/locator');

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
  private registry: Map<string, Registry[keyof Registry]>;
  private ready: boolean;
  constructor() {
    this.registry = new Map();
    this.ready = false;
  }

  register = <Key extends keyof Registry>(name: Key, instance: Registry[Key]) => {
    if (this.registry.has(name)) {
      logger.warn(`[-] service [${name}] is already registered.`);
    }

    this.registry.set(name, instance);
  };

  resolve = <Key extends keyof Registry>(name: Key) => {
    const service = this.registry.get(name);
    if (!service) throw new ServiceNotRegistered(`service [${name}] is not registered`, { service: name });

    return service as Registry[Key];
  };

  reset = () => {
    this.registry.clear();
    this.ready = false;
  };

  initialized = () => this.ready;

  seal = () => { this.ready = true; };
}

const services = new ServiceRegistry();

const bootstrap = (env: EnvironmentType) => {
  if (services.initialized()) return;

  services.register('database', new Database(env.DB));
  services.register('database:analytics', new AnalyticsRepository(services.resolve('database')));
  services.register('database:endpoints', new EndpointsRepository(services.resolve('database')));

  services.register('service:sandbox', new SandboxService(config?.sandbox?.timeout));

  services.register('service:analytics', new AnalyticsService(services.resolve('database:analytics')));
  services.register('service:endpoints', new EndpointsService(services.resolve('database:endpoints'), services.resolve('service:sandbox')));
  services.register('service:healthcheck', new HealthService(services.resolve('database')));

  services.seal();
  logger.info('services initialized');
};

export { bootstrap, services, ServiceRegistry };
