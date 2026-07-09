import { bootstrap as bootstrap_config, config } from './config';
import { listeners } from './eventing';
import { AccessLog, Authentication, BodyParser, CORS, ErrorHandler, RateLimiter, RequestContext } from './middlewares';
import { Router, configure } from './routes';
import { bootstrap as bootstrap_services } from './services';
import type { EnvironmentType } from './types';

let router: Router | null = null;

const bootstrap = (env: EnvironmentType) => {
  if (router) return router;

  bootstrap_config(env);
  bootstrap_services(env);
  listeners.initialize();

  router = new Router();
  router.use(new RequestContext());
  router.use(new AccessLog());
  router.use(new Authentication({ ...config?.middleware?.authentication }));
  router.use(new CORS({ ...config?.middleware?.cors }));
  router.use(new RateLimiter({ ...config?.middleware?.ratelimiter }));
  router.use(new BodyParser());
  router.use(new ErrorHandler());

  configure(router);
  return router;
};

export default {
  async fetch(req: Request, env: EnvironmentType): Promise<Response> {
    const router = bootstrap(env);
    return router.handle(req).catch((error: Error) => {
      return new Response(JSON.stringify({ error: error?.message ?? 'Internal Server Error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    });
  },
};
