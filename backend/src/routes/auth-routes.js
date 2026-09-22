import { Router } from 'express';
import { createAuthController } from '../controllers/auth-controller.js';

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function authRoutes(userService, authenticateFirebase) {
  const router = Router();
  const controller = createAuthController(userService);
  router.post('/auth/session', authenticateFirebase, asyncRoute(controller.session));
  return router;
}
