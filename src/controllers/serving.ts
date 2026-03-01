import { loggerFor, responsify } from '../common';
import { config } from '../config';
import { HandlerExecutionFailed } from '../errors';
import { EndpointRequested, EventPublisher } from '../eventing';
import { services } from '../services';
import type { Context } from '../types';

const logger = loggerFor(import.meta.url);

class ServingController {
  private get_endpoints_service = () => {
    return services.resolve('service:endpoints');
  };

  private get_sandbox_service = () => {
    return services.resolve('service:sandbox');
  };

  serve = async (context: Context) => {
    const { req, req: { method = 'GET' }, url, url: { pathname = '' }, body } = context;
    logger.info(`serving ${method} method with endpoint ${pathname}`);

    const endpoints = this.get_endpoints_service();
    const sandbox = this.get_sandbox_service();

    const endpoint = endpoints.find_by_path_and_method(pathname, method);
    logger.info(`matched endpoint ${endpoint?.id} for path ${pathname} and method ${method}`);

    const query = Object.fromEntries(url.searchParams);
    const headers = Object.fromEntries(req.headers);
    const params = endpoint?.params ?? {};

    const [error, response] = await sandbox.execute(endpoint?.handler, { query, headers, params, body });
    if (error) {
      const timedout = error.cause === 'ETIMEDOUT';

      const payload = { endpoint_id: endpoint?.id, cause: error.message, ...(timedout && { timeout_ms: config?.sandbox?.timeout }) };
      throw new HandlerExecutionFailed(error?.message, payload);
    }

    EventPublisher.emit(new EndpointRequested({ id: endpoint?.id }));
    logger.info(`serving endpoint ${endpoint?.id} with response ${JSON.stringify(response)}`);

    return responsify(response);
  };
}

export { ServingController };
