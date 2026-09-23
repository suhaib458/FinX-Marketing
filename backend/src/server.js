import express from 'express';
import { createApp } from './app.js';

function classifyStartup(error) {
  const message = String(error?.message || '');
  if (message.includes('Invalid environment configuration')) return 'ENV_CONFIGURATION';
  if (message.includes('not valid JSON')) return 'SERVICE_ACCOUNT_JSON';
  if (/firebase/i.test(message)) return 'FIREBASE_INITIALIZATION';
  if (/prisma|mariadb|database/i.test(message)) return 'DATABASE_INITIALIZATION';
  if (/ssl|tls|certificate/i.test(message)) return 'DATABASE_TLS';
  return 'UNKNOWN_STARTUP';
}

let runtime;
let startupCode = null;

try {
  runtime = createApp();
} catch (error) {
  startupCode = classifyStartup(error);
  console.error('[FINX_STARTUP_ERROR]', startupCode);
}

const app = runtime?.app ?? express();

if (!runtime) {
  app.disable('x-powered-by');
  app.get('/api/v1/health/live', (_req, res) => {
    res.status(503).json({ status: 'startup_error', code: startupCode });
  });
  app.get('/api/v1/health/ready', (_req, res) => {
    res.status(503).json({ status: 'not_ready', code: startupCode });
  });
  app.get('/api/v1/version', (_req, res) => {
    res.status(503).json({ status: 'startup_error', code: startupCode });
  });
  app.use((_req, res) => {
    res.status(503).json({ error: { code: startupCode, message: 'Backend initialization failed' } });
  });
}

// Vercel's Express runtime consumes the exported app directly.
export default app;

// Local development keeps using a regular TCP listener.
if (runtime && !process.env.VERCEL) {
  const { config, database, logger, aiProvider } = runtime;
  const server = app.listen(config.port, () => {
    logger.info({
      port: config.port,
      aiConfigured: Boolean(aiProvider?.configured),
      aiModel: aiProvider?.model || null,
    }, 'FinX backend listening');
  });

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'graceful shutdown started');
    server.close(async (error) => {
      try { await database.disconnect(); } catch (disconnectError) {
        logger.error({ err: disconnectError }, 'database disconnect failed');
      }
      if (error) logger.error({ err: error }, 'server close failed');
      process.exitCode = error ? 1 : 0;
    });
    setTimeout(() => {
      logger.error('graceful shutdown timed out');
      process.exitCode = 1;
      server.closeAllConnections();
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (error) => logger.error({ err: error }, 'unhandled rejection'));
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaught exception');
    shutdown('uncaughtException');
  });
}
