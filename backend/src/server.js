import express from 'express';

function classifyStartup(error) {
  const message = String(error?.message || '');
  const code = String(error?.code || '');

  if (message.includes('Invalid environment configuration')) return 'ENV_CONFIGURATION';
  if (message.includes('not valid JSON')) return 'SERVICE_ACCOUNT_JSON';
  if (/private key|pem|credential/i.test(message)) return 'FIREBASE_CREDENTIALS';
  if (/firebase/i.test(message)) return 'FIREBASE_INITIALIZATION';
  if (/prisma|mariadb|database/i.test(message)) return 'DATABASE_INITIALIZATION';
  if (/ssl|tls|certificate/i.test(message)) return 'DATABASE_TLS';
  if (/trust proxy|rate.?limit/i.test(message)) return 'RATE_LIMIT_CONFIGURATION';
  if (code === 'ERR_MODULE_NOT_FOUND' || /cannot find (module|package)|module not found/i.test(message)) return 'MODULE_NOT_FOUND';
  if (code === 'ERR_UNKNOWN_FILE_EXTENSION' || /does not provide an export|unknown file extension/i.test(message)) return 'MODULE_FORMAT';
  if (/enoent|no such file or directory/i.test(message)) return 'FILE_NOT_FOUND';
  if (error?.name === 'SyntaxError') return 'SYNTAX_ERROR';
  if (error?.name === 'TypeError') return 'TYPE_ERROR';
  return code ? `NODE_${code}` : 'UNKNOWN_STARTUP';
}

let runtime;
let startupCode = null;
let startupMeta = null;

try {
  const appModule = await import('./app.js');
  runtime = appModule.createApp();
} catch (error) {
  startupCode = classifyStartup(error);
  startupMeta = {
    name: String(error?.name || 'Error').slice(0, 48),
    nodeCode: error?.code ? String(error.code).slice(0, 64) : null,
  };
  console.error('[FINX_STARTUP_ERROR]', startupCode, startupMeta);
}

const app = runtime?.app ?? express();

if (!runtime) {
  app.disable('x-powered-by');
  app.get('/api/v1/health/live', (_req, res) => {
    res.status(503).json({ status: 'startup_error', code: startupCode, diagnostic: startupMeta });
  });
  app.get('/api/v1/health/ready', (_req, res) => {
    res.status(503).json({ status: 'not_ready', code: startupCode, diagnostic: startupMeta });
  });
  app.get('/api/v1/version', (_req, res) => {
    res.status(503).json({ status: 'startup_error', code: startupCode });
  });
  app.use((_req, res) => {
    res.status(503).json({ error: { code: startupCode, message: 'Backend initialization failed' } });
  });
}

export default app;

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