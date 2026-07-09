import { env } from 'cloudflare:workers';
import { vi } from 'vitest';
import { Database } from '../../src/database';
import { AnalyticsRepository } from '../../src/database/repositories/analytics';
import { EndpointsRepository } from '../../src/database/repositories/endpoints';
import { EventPublisher, listeners } from '../../src/eventing';
import { AnalyticsService } from '../../src/services/analytics';
import { EndpointsService } from '../../src/services/endpoints';
import { HealthService } from '../../src/services/healthcheck';
import { ServiceRegistry } from '../../src/services/locator';
import { SandboxService } from '../../src/services/sandbox';

vi.mock('jose', () => ({
  jwtVerify: vi.fn(async (token: string) => {
    if (!token) throw new Error('No Token Provided');
    if (token.toLowerCase() === 'invalid') throw new Error('Invalid Token');
    return { payload: { user: 'test-user' } };
  }),
}));

const setup = async () => {
  await env.DB.exec('DELETE FROM analytics');
  await env.DB.exec('DELETE FROM endpoints');

  const services = new ServiceRegistry();
  const database = new Database(env.DB);

  services.register('database', database);
  services.register('database:endpoints', new EndpointsRepository(database));
  services.register('database:analytics', new AnalyticsRepository(database));
  services.register('service:sandbox', new SandboxService(10000));
  services.register('service:healthcheck', new HealthService(database));
  services.register('service:analytics', new AnalyticsService(services.resolve('database:analytics')));
  services.register('service:endpoints', new EndpointsService(services.resolve('database:endpoints'), services.resolve('service:sandbox')));

  EventPublisher.release();
  listeners.initialize();

  return services;
};

export { setup };
