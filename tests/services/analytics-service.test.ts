import { beforeEach, describe, expect, test } from 'vitest';
import { setup } from '../setup';

describe('AnalyticsService', async () => {
  let services = await setup();
  let analytics_repo = services.resolve('database:analytics');

  let analytics_service = services.resolve('service:analytics');
  let endpoints_service = services.resolve('service:endpoints');

  beforeEach(async () => {
    services = await setup();
    analytics_repo = services.resolve('database:analytics');

    analytics_service = services.resolve('service:analytics');
    endpoints_service = services.resolve('service:endpoints');
  });

  describe('find', () => {
    test('should return empty array when no analytics exist', async () => {
      const response = await analytics_service.find();

      expect(Array.isArray(response)).toBe(true);
    });

    test('should find analytics for existing endpoint', async () => {
      const endpoint = await endpoints_service.create('/api/test', 'GET', '() => ({ ok: true })');
      await analytics_repo.create_for_endpoint(endpoint.id);

      const response = await analytics_service.find(endpoint.id);

      if (!response) throw new Error('Analytics Not Found');
      if (Array.isArray(response)) throw new Error('Expected Single Analytics Object');

      expect(response).toBeDefined();
      expect(response.endpoint_id).toBe(endpoint.id);
    });
  });

  describe('increment', () => {
    test('should increment analytics for existing endpoint', async () => {
      const endpoint = await endpoints_service.create('/api/test', 'GET', '() => ({ ok: true })');
      await analytics_repo.create_for_endpoint(endpoint.id);

      await expect(analytics_service.increment(endpoint.id)).resolves.not.toThrow();
    });
  });
});
