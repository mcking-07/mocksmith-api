import { responsify } from '../common';
import { description, name, version } from '../../package.json';

const { env: { NODE_ENV = 'development' } = {} } = process;

class BaseController {
  info = async () => {
    const response = {
      name, version, description, runtime: `Bun ${Bun.version}`, environment: NODE_ENV,
    };

    return responsify({ status: 200, body: response });
  };
}

export { BaseController };
