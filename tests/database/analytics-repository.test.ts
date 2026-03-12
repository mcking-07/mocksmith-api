import { beforeEach, describe, expect, test } from 'bun:test';
import { setup } from '../setup';

describe('AnalyticsRepository', async () => {
  let services = await setup();
  let analytics_repo = services.resolve('database:analytics');

  beforeEach(async () => {
    services = await setup();
    analytics_repo = services.resolve('database:analytics');
  });

  describe('create_for_endpoint', () => {
    test('should create analytics record for endpoint', () => {
      const [error, id] = analytics_repo.create_for_endpoint('test-endpoint-123');

      expect(error).toBeNull();
      expect(typeof id).toBe('string');
      expect(id?.length).toBeGreaterThan(0);
    });
  });

  describe('find_by_endpoint_id', () => {
    test('should return analytics for existing endpoint', () => {
      const endpoint_id = 'test-endpoint-456';
      analytics_repo.create_for_endpoint(endpoint_id);

      const analytics = analytics_repo.find_by_endpoint_id(endpoint_id);

      expect(analytics).not.toBeNull();
      expect(analytics?.endpoint_id).toBe(endpoint_id);
      expect(analytics?.request_count).toBe(0);
    });
  });

  describe('increment', () => {
    test('should increase request count', () => {
      const endpoint_id = 'test-endpoint-789';
      analytics_repo.create_for_endpoint(endpoint_id);

      const [first_error] = analytics_repo.increment(endpoint_id);
      expect(first_error).toBeNull();

      let analytics = analytics_repo.find_by_endpoint_id(endpoint_id);
      expect(analytics?.request_count).toBe(1);

      const [second_error] = analytics_repo.increment(endpoint_id);
      expect(second_error).toBeNull();

      analytics = analytics_repo.find_by_endpoint_id(endpoint_id);
      expect(analytics?.request_count).toBe(2);
    });
  });
});
