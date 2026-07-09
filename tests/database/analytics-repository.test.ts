import { beforeEach, describe, expect, test } from 'vitest';
import { setup } from '../setup';

describe('AnalyticsRepository', async () => {
  let services = await setup();
  let analytics_repo = services.resolve('database:analytics');
  let endpoints_repo = services.resolve('database:endpoints');

  beforeEach(async () => {
    services = await setup();
    analytics_repo = services.resolve('database:analytics');
    endpoints_repo = services.resolve('database:endpoints');
  });

  const create_endpoint = async () => {
    const [, id] = await endpoints_repo.create({ path: `/test/${crypto.randomUUID()}`, method: 'GET', handler: '() => ({})' });
    return id!;
  };

  describe('create_for_endpoint', () => {
    test('should create analytics record for endpoint', async () => {
      const endpoint_id = await create_endpoint();
      const [error, id] = await analytics_repo.create_for_endpoint(endpoint_id);

      expect(error).toBeNull();
      expect(typeof id).toBe('string');
      expect(id?.length).toBeGreaterThan(0);
    });
  });

  describe('find_by_endpoint_id', () => {
    test('should return analytics for existing endpoint', async () => {
      const endpoint_id = await create_endpoint();
      await analytics_repo.create_for_endpoint(endpoint_id);

      const analytics = await analytics_repo.find_by_endpoint_id(endpoint_id);

      expect(analytics).not.toBeNull();
      expect(analytics?.endpoint_id).toBe(endpoint_id);
      expect(analytics?.request_count).toBe(0);
    });
  });

  describe('increment', () => {
    test('should increase request count', async () => {
      const endpoint_id = await create_endpoint();
      await analytics_repo.create_for_endpoint(endpoint_id);

      const [first_error] = await analytics_repo.increment(endpoint_id);
      expect(first_error).toBeNull();

      let analytics = await analytics_repo.find_by_endpoint_id(endpoint_id);
      expect(analytics?.request_count).toBe(1);

      const [second_error] = await analytics_repo.increment(endpoint_id);
      expect(second_error).toBeNull();

      analytics = await analytics_repo.find_by_endpoint_id(endpoint_id);
      expect(analytics?.request_count).toBe(2);
    });
  });
});
