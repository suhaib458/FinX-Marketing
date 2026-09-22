export function createHealthController({ config, database }) {
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
    version(_req, res) {
      res.json({ version: config.version, environment: config.nodeEnv });
    },
  };
}
