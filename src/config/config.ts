const { env: { DATABASE_PATH, NODE_ENV, HOSTNAME, PORT, AUTH_ENABLED, AUTH_SECRET, CORS_ORIGIN } = {} } = process;

const required = (value: string | undefined, name: string): string => {
  if (value === undefined || value === '') {
    throw new Error(`environment variable misconfigured ${name}`);
  }

  return value;
};

const config = {
  environment: NODE_ENV ?? 'development',
  database: {
    path: required(DATABASE_PATH, 'DATABASE_PATH'),
  },
  server: {
    hostname: required(HOSTNAME, 'HOSTNAME'),
    port: Number(required(PORT, 'PORT')),
  },
  middleware: {
    authentication: {
      enabled: AUTH_ENABLED === 'true',
      secret: AUTH_SECRET ?? ''
    },
    cors: {
      origin: CORS_ORIGIN
    },
    ratelimiter: {
      window_in_milliseconds: 60000,
      maximum_requests: 100
    }
  },
  sandbox: {
    timeout: 10000,
    env: {
      PATH: Bun.env.PATH ?? '/usr/bin:/bin',
      NODE_ENV: 'production',
      HOME: '/tmp',
      TMPDIR: '/tmp'
    },
    cwd: '/tmp'
  }
};

export { config };
