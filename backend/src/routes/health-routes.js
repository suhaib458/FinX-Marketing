import { Router } from 'express';

export function healthRoutes(controller) {
  const router = Router();
  router.get('/health/live', controller.live);
  router.get('/health/ready', controller.ready);
  router.get('/health/storage', controller.storage);
  router.get('/health/ai', controller.ai);
  router.get('/version', controller.version);
  return router;
}
