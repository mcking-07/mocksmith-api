import { join } from 'path';
import { mock } from 'bun:test';
import { Database } from '../../src/database';
import { Migrations } from '../../database/migrations';
import { ServiceRegistry } from '../../src/services/locator';
import { listeners, EventPublisher } from '../../src/eventing';
import { EndpointsRepository } from '../../src/database/repositories/endpoints';
import { AnalyticsRepository } from '../../src/database/repositories/analytics';
import { EndpointsService } from '../../src/services/endpoints';
import { AnalyticsService } from '../../src/services/analytics';
import { SandboxService } from '../../src/services/sandbox';
import { HealthService } from '../../src/services/healthcheck';

const DATABASE_PATH = ':memory:';
const DATABASE_MIGRATIONS_PATH = join(import.meta.dir, '..', '..', 'database', 'migrations');

const setup = async () => {
  mock.module('jose', () => ({
    jwtVerify: mock(async (token: string) => {
      if (!token) throw new Error('No Token Provided');
      if (token.toLowerCase() === 'invalid') throw new Error('Invalid Token');

      return { payload: { user: 'test-user' } };
    })
  }));

  const services = new ServiceRegistry();

  const database = new Database(DATABASE_PATH);
  const migrations = new Migrations(database.underlying, DATABASE_MIGRATIONS_PATH);
  await migrations.run({ command: 'migrate' });

  services.register('database', database);

  services.register('database:endpoints', new EndpointsRepository(database));
  services.register('database:analytics', new AnalyticsRepository(database));

  services.register('service:sandbox', new SandboxService());
  services.register('service:healthcheck', new HealthService(database));

  services.register('service:analytics', new AnalyticsService(services.resolve('database:analytics')));
  services.register('service:endpoints', new EndpointsService(services.resolve('database:endpoints'), services.resolve('service:sandbox')));

  EventPublisher.release();
  listeners.initialize();

  return services;
};

export { setup };
