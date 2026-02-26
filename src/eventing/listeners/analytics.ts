import { loggerFor } from '../../common';
import { services } from '../../services';
import type { ListenerType } from '../../types';
import { EndpointCreated, EndpointRequested } from '../events';
import { EventPublisher } from '../publisher';

const logger = loggerFor(import.meta.url);

class AnalyticsListener implements ListenerType {
  private get_analytics_repository = () => {
    return services.resolve('database:analytics');
  };

  private handle_endpoint_created = (event: EndpointCreated) => {
    const { payload: { id } } = event;
    const repository = this.get_analytics_repository();

    logger.info(`creating analytics record for endpoint ${id}`);
    const [error] = repository.create_for_endpoint(id);

    if (error) logger.error(`failed to create analytics record for endpoint ${id}`, error);
    else logger.info(`analytics record created for endpoint ${id}`);
  };

  private handle_endpoint_requested = (event: EndpointRequested) => {
    const { payload: { id } } = event;
    const repository = this.get_analytics_repository();

    logger.info(`incrementing analytics record for endpoint ${id}`);
    const [error] = repository.increment(id);

    if (error) logger.error(`failed to increment analytics record for endpoint ${id}`, error);
    else logger.info(`analytics record incremented for endpoint ${id}`);
  };

  register = () => {
    EventPublisher.on(EndpointCreated.name, this.handle_endpoint_created);
    EventPublisher.on(EndpointRequested.name, this.handle_endpoint_requested);
  };
}

export { AnalyticsListener };
