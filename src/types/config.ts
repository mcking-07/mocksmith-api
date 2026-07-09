type ConfigType = {
  environment: string;
  middleware: {
    authentication: { enabled: boolean; secret: string; };
    cors: { origin: string | undefined; };
    ratelimiter: { window_in_milliseconds: number; maximum_requests: number; };
  };
  sandbox: { timeout: number; };
};

export type { ConfigType };
