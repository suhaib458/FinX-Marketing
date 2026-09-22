import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { loadConfig } from './config/env.js';
import { createHealthController } from './controllers/health-controller.js';
import { createDatabase } from './infrastructure/database.js';
import { createFirebaseTokenVerifier } from './infrastructure/firebase-admin.js';
import { createLogger } from './infrastructure/logger.js';
import { createStorageProvider } from './infrastructure/storage.js';
import { createGeminiProvider } from './infrastructure/gemini.js';
import { createUploadMiddleware } from './middleware/upload.js';
import { combinedAuth, firebaseAuth } from './middleware/firebase-auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';
import { requestLogging } from './middleware/request-logging.js';
import { createRepositories } from './repositories/index.js';
import { healthRoutes } from './routes/health-routes.js';
import { authRoutes } from './routes/auth-routes.js';
import { protectedRoutes } from './routes/protected-routes.js';
import { createServices } from './services/index.js';

export function createApp(options = {}) {
  const config = options.config ?? loadConfig();
  const logger = options.logger ?? createLogger(config);
  const database = options.database ?? createDatabase(config);
  const repositories = options.repositories ?? createRepositories(database.prisma);
  const storageProvider = options.storageProvider ?? createStorageProvider({ config, logger });
  const aiProvider = options.aiProvider ?? createGeminiProvider(config, logger);
  const services = options.services ?? createServices(repositories, { storageProvider, config, logger, aiProvider });
  const tokenVerifier = options.tokenVerifier ?? createFirebaseTokenVerifier(config);
  const uploadMiddleware = options.uploadMiddleware ?? createUploadMiddleware(config);
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(requestId);
  app.use(requestLogging(logger));
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS_ORIGIN_DENIED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.jsonBodyLimit }));
  app.use('/api/v1', rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests', requestId: req.id } });
    },
  }));

  app.use('/api/v1', healthRoutes(createHealthController({ config, database, aiProvider })));
  app.use('/api/v1', authRoutes(services.users, firebaseAuth(tokenVerifier)));
  app.use('/api/v1', protectedRoutes(services, combinedAuth({ config, tokenVerifier, userService: services.users }), { uploadMiddleware }));
  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return { app, config, database, logger, storageProvider, aiProvider };
}
