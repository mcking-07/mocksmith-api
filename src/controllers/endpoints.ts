import { Validator, loggerFor, responsify } from '../common';
import { ValidationFailed } from '../errors';
import { services } from '../services';
import type { Context } from '../types';

const logger = loggerFor(import.meta.url);

class EndpointsController {
  private get_endpoints_service = () => {
    return services.resolve('service:endpoints');
  };

  read = async (context: Context) => {
    const id = context?.params?.id as string | undefined;
    const service = this.get_endpoints_service();

    logger.info(`finding ${id ? `endpoint with id ${id}` : 'all endpoints'}`);
    const response = service.find(id);

    logger.info(`found ${Array.isArray(response) ? response.length : 1} endpoint(s)`);
    return responsify({ status: 200, body: response });
  };

  create = async (context: Context) => {
    const body = context?.body as Record<string, unknown>;
    const validator = new Validator<{ path: string; method: string; handler: string; }>(body);

    const { success, errors, payload } = validator.path('path').string('method').string('handler').validate();
    if (!success) throw new ValidationFailed('validation failed', errors);

    const service = this.get_endpoints_service();
    const response = service.create(payload.path, payload.method, payload.handler);

    logger.info(`created endpoint with id ${response.id}`);
    return responsify({ status: 201, body: response });
  };

  update = async (context: Context) => {
    const id = context?.params?.id as string;
    const body = context?.body as Record<string, unknown>;
    const validator = new Validator<{ path: string; method: string; handler: string; }>(body);

    const { success, errors, payload } = validator.path('path', { optional: true }).string('method', { optional: true }).string('handler', { optional: true }).validate();
    if (!success) throw new ValidationFailed('validation failed', errors);

    const service = this.get_endpoints_service();
    const response = service.update(id, payload.path, payload.method, payload.handler);

    logger.info(`updated endpoint with id ${response.id}`);
    return responsify({ status: 200, body: response });
  };

  remove = async (context: Context) => {
    const id = context?.params?.id as string;
    const service = this.get_endpoints_service();

    service.delete(id);
    logger.info(`removed endpoint with id ${id}`);

    return responsify({ status: 200, body: { message: `endpoint ${id} removed successfully` } });
  };
}

export { EndpointsController };
