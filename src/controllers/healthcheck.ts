import { responsify } from '../common';
import { services } from '../services';

class HealthController {
  private get_healthcheck_service = () => {
    return services.resolve('service:healthcheck');
  };

  check = async () => {
    const service = this.get_healthcheck_service();
    const response = await service.check();

    const status = response?.status === 'healthy' ? 200 : 503;
    return responsify({ status, body: response });
  };
}
export { HealthController };