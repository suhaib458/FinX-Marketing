import { Router } from 'express';

export function healthRoutes(controller) {
  const router = Router();
  router.get('/health/live', controller.live);
  router.get('/health/ready', controller.ready);
  router.get('/version', controller.version);
  return router;
}
