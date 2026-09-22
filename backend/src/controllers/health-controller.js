export function createHealthController({ config, database, aiProvider }) {
  return {
    live(_req, res) { res.json({ status: 'ok' }); },

    async ready(_req, res) {
      try {
        const connected = await database.checkConnection();
        if (!connected) return res.status(503).json({ status: 'not_ready', database: 'unavailable' });
        return res.json({ status: 'ready', database: 'connected' });
      } catch {
        return res.status(503).json({ status: 'not_ready', database: 'unavailable' });
      }
    },

    async ai(_req, res) {
      const result = await aiProvider.checkConnection();
      const httpStatus = result.status === 'ready' ? 200 : result.status === 'not_configured' ? 503 : 502;
      return res.status(httpStatus).json(result);
    },

    version(_req, res) {
      res.json({
        version: config.version,
        environment: config.nodeEnv,
        aiModel: config.xkiroModel || null,
      });
    },
  };
}
