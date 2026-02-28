import { loggerFor, ShutdownManager } from './common';
import { config } from './config';
import { listeners } from './eventing';
import { AccessLog, Authentication, BodyParser, CORS, ErrorHandler, RateLimiter, RequestContext } from './middlewares';
import { Router, configure } from './routes';

const logger = loggerFor(import.meta.url);

const router = new Router();

router.use(new RequestContext());
router.use(new AccessLog());
router.use(new Authentication({ ...config?.middleware?.authentication }));
router.use(new CORS({ ...config?.middleware?.cors }));
router.use(new RateLimiter({ ...config?.middleware?.ratelimiter }));
router.use(new BodyParser());
router.use(new ErrorHandler());

configure(router);
listeners.initialize();

const server = Bun.serve({
  ...(config?.server?.hostname && { hostname: config.server.hostname }),
  port: config.server.port,
  routes: {
    '/favicon.ico': new Response(Bun.file('./public/favicon.ico'), { headers: { 'Content-Type': 'image/x-icon' } }),
    '/.well-known/appspecific/com.chrome.devtools.json': new Response(null, { status: 204 })
  },
  fetch: (req: Request) => router.handle(req),
  error: (error) => new Response(JSON.stringify({ error: error.message ?? 'Internal Server Error' }), { status: 500 }),
  idleTimeout: 30
});

const shutdown = new ShutdownManager(server);
shutdown.listen();

logger.info(`mocksmith-api running on port ${config.server.port}`);
