import { AnalyticsController, BaseController, EndpointsController, HealthController, ServingController } from '../controllers';
import { AccessLog, Authentication, BodyParser, RateLimiter } from '../middlewares';
import type { Router } from './router';

const configure = (router: Router) => {
  const controllers = {
    analytics: new AnalyticsController(),
    base: new BaseController(),
    endpoints: new EndpointsController(),
    healthcheck: new HealthController(),
    serving: new ServingController(),
  };

  router.route('GET', '/', controllers.base.info);
  router.route('GET', '/healthcheck', controllers.healthcheck.check);
  router.route('GET', '/.well-known/appspecific/com.chrome.devtools.json', async () => new Response(null, { status: 204 }), { skip: [AccessLog, Authentication, RateLimiter, BodyParser] });

  router.route('GET', '/analytics', controllers.analytics.read);
  router.route('GET', '/analytics/:id', controllers.analytics.read);

  router.route('GET', '/endpoints', controllers.endpoints.read);
  router.route('GET', '/endpoints/:id', controllers.endpoints.read);
  router.route('POST', '/endpoints', controllers.endpoints.create);
  router.route('PUT', '/endpoints/:id', controllers.endpoints.update);
  router.route('DELETE', '/endpoints/:id', controllers.endpoints.remove);

  router.route('*', '/*path', controllers.serving.serve);
};

export { configure };
