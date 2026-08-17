import type { ConfigType, EnvironmentType } from '../types';

const config = {} as ConfigType;

const bootstrap = (env: EnvironmentType) => {
  Object.assign(config, {
    environment: env.NODE_ENV ?? 'development',
    middleware: {
      authentication: {
        enabled: env.AUTH_ENABLED === 'true',
        secret: env.AUTH_SECRET ?? '',
      },
      cors: {
        origin: env.CORS_ORIGIN,
      },
      ratelimiter: {
        window_in_milliseconds: 60000,
        maximum_requests: 100,
      },
    },
    sandbox: {
      timeout: 10000,
    },
  });

  return config;
};

export { bootstrap, config };
