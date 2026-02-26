import { loggerFor, safe } from '../common';
import type { AnalyticsRepository } from '../database';

const logger = loggerFor(import.meta.url);

class AnalyticsService {
  private readonly analytics: AnalyticsRepository;
  constructor(analytics: AnalyticsRepository) {
    this.analytics = analytics;
  }

  find = (id?: string) => {
    if (!id) {
      logger.info('reading analytics for all endpoints');
      return this.analytics.read();
    }

    logger.info(`finding analytics for endpoint_id: ${id}`);
    return this.analytics.find_by_endpoint_id(id);
  };

  increment = safe((endpoint_id: string) => {
    logger.info(`incrementing analytics for endpoint_id: ${endpoint_id}`);
    return this.analytics.increment(endpoint_id);
  });
}

export { AnalyticsService };
