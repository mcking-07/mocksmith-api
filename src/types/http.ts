import type { ParamData, match } from 'path-to-regexp';

type ContextStore = {
  request_id: string;
};

type Context = {
  id?: string;
  req: Request;
  url: URL;
  params: ParamData;
  state: Map<string, unknown>;
  body?: unknown;
};

type HandlerResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

type Handler = (context: Context) => Promise<Response>;

type NextFunction = () => Promise<Response>;

type Middleware = {
  handle: (context: Context, next: NextFunction) => Promise<Response>;
};

type AuthenticationOptions = {
  enabled?: boolean;
  secret?: string;
};

type CorsOptions = {
  origin?: string | string[];
  methods?: string[];
  headers?: string;
};

type Parser = (req: Request) => Promise<unknown>;

type Parsers = Record<string, Parser>;

type RateLimiterOptions = {
  window_in_milliseconds?: number;
  maximum_requests?: number;
};

type RateLimitRecord = {
  tokens: number;
  refilled_at: number;
};

type RouteOptions = {
  middleware?: Middleware[];
  skip?: Array<new (...args: unknown[]) => Middleware>;
};

type Route = {
  method: string;
  path: string;
  matcher: ReturnType<typeof match>;
  handler: Handler;
  options?: RouteOptions;
};

type SandboxContext = {
  query: Record<string, string>;
  headers: Record<string, string>;
  params: Context['params'];
  body: Context['body'];
};

type SandboxResponse = {
  success: false;
  error: { name: string; message: string; stack: string; };
} | {
  success: true;
  payload: HandlerResponse;
};

type ValidatorOptions = {
  optional?: boolean;
};

export type {
  AuthenticationOptions,
  Context,
  ContextStore,
  CorsOptions,
  Handler,
  HandlerResponse,
  Middleware,
  NextFunction,
  Parser,
  Parsers,
  RateLimiterOptions,
  RateLimitRecord,
  Route,
  RouteOptions,
  SandboxContext,
  SandboxResponse,
  ValidatorOptions,
};
