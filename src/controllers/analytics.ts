import { loggerFor, responsify } from '../common';
import { services } from '../services';
import type { Context } from '../types';

const logger = loggerFor('controllers/analytics');

class AnalyticsController {
  private get_analytics_service = () => {
    return services.resolve('service:analytics');
  };

  read = async (context: Context) => {
    const id = context?.params?.id as string | undefined;
    const service = this.get_analytics_service();

    logger.info(`finding ${id ? `analytics for endpoint id ${id}` : 'all analytics'}`);
    const response = await service.find(id);

    logger.info(`found ${Array.isArray(response) ? response.length : 1} analytics record(s)`);
    return responsify({ status: 200, body: response });
  };
}

export { AnalyticsController };
