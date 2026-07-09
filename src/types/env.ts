type EnvironmentType = {
  DB: D1Database;
  AUTH_ENABLED: string;
  AUTH_SECRET: string;
  CORS_ORIGIN: string;
  NODE_ENV: string;
};

export type { EnvironmentType };
