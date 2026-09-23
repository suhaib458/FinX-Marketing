import { createApp } from './app.js';

const runtime = createApp();
const { app, config, database, logger, aiProvider } = runtime;

// Vercel's Express runtime consumes the exported app directly.
export default app;

// Local development keeps using a regular TCP listener.
if (!process.env.VERCEL) {
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
