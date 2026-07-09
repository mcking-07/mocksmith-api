import { responsify } from '../common';
import { config } from '../config';

class BaseController {
  info = async () => {
    const response = {
      name: 'mocksmith-api', version: '1.0.0', description: 'a simple api to forge mocks with ease.', runtime: 'cloudflare-workers', environment: config?.environment,
    };

    return responsify({ status: 200, body: response });
  };
}

export { BaseController };
