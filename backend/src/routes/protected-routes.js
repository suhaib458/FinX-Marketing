import { Router } from 'express';
import { createAssetController } from '../controllers/asset-controller.js';
import { createBrandController } from '../controllers/brand-controller.js';
import { createContentController } from '../controllers/content-controller.js';
import { createCreditController } from '../controllers/credit-controller.js';
import { createUserController } from '../controllers/user-controller.js';
import { createGenerationController } from '../controllers/generation-controller.js';
import { brandIdParamsSchema, contentIdParamsSchema } from '../schemas/common.js';
import { assetIdParamsSchema, assetListQuerySchema, uploadAssetBodySchema } from '../schemas/asset-schema.js';
import { createBrandSchema, brandListQuerySchema, updateBrandSchema } from '../schemas/brand-schema.js';
import { contentListQuerySchema, updateContentSchema } from '../schemas/content-schema.js';
import { ledgerQuerySchema } from '../schemas/credit-schema.js';
import { generationRequestSchema, variationRequestSchema } from '../schemas/generation-schema.js';
import { validate } from '../middleware/validate.js';

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function protectedRoutes(services, authenticate, options = {}) {
  const router = Router();
  const users = createUserController(services.users);
  const brands = createBrandController(services.brands);
  const credits = createCreditController(services.credits);
  const contents = createContentController(services.contents);
  const assets = createAssetController(services.assets);
  const generations = createGenerationController(services.generations);
  const uploadMiddleware = options.uploadMiddleware ?? ((_req, _res, next) => next());

  router.use(authenticate);
  router.get('/me', users.me);

  router.get('/brands', validate({ query: brandListQuerySchema }), asyncRoute(brands.list));
  router.post('/brands', validate({ body: createBrandSchema }), asyncRoute(brands.create));
  router.get('/brands/:brandId', validate({ params: brandIdParamsSchema }), asyncRoute(brands.get));
  router.patch('/brands/:brandId', validate({ params: brandIdParamsSchema, body: updateBrandSchema }), asyncRoute(brands.update));
  router.delete('/brands/:brandId', validate({ params: brandIdParamsSchema }), asyncRoute(brands.remove));

  router.get('/credits', asyncRoute(credits.balance));
  router.get('/credits/ledger', validate({ query: ledgerQuerySchema }), asyncRoute(credits.ledger));

  router.get('/contents', validate({ query: contentListQuerySchema }), asyncRoute(contents.list));
  router.get('/contents/:contentId', validate({ params: contentIdParamsSchema }), asyncRoute(contents.get));
  router.patch('/contents/:contentId', validate({ params: contentIdParamsSchema, body: updateContentSchema }), asyncRoute(contents.update));
  router.delete('/contents/:contentId', validate({ params: contentIdParamsSchema }), asyncRoute(contents.remove));
  router.post('/contents/:contentId/variations', validate({ params: contentIdParamsSchema, body: variationRequestSchema }), asyncRoute(generations.variation));

  router.post('/ai/generate', validate({ body: generationRequestSchema }), asyncRoute(generations.generate));

  router.post('/assets/upload', uploadMiddleware, validate({ body: uploadAssetBodySchema }), asyncRoute(assets.upload));
  router.get('/assets', validate({ query: assetListQuerySchema }), asyncRoute(assets.list));
  router.get('/assets/:assetId', validate({ params: assetIdParamsSchema }), asyncRoute(assets.get));
  router.delete('/assets/:assetId', validate({ params: assetIdParamsSchema }), asyncRoute(assets.remove));

  return router;
}
