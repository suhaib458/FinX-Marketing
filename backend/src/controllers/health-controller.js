function safeDatabaseDiagnostic(error) {
  const adapterCause = error?.meta?.driverAdapterError?.cause;
  const codeCandidates = [
    adapterCause?.originalCode,
    adapterCause?.code,
    error?.meta?.code,
    error?.cause?.code,
    error?.cause?.errno,
    error?.errno,
    error?.code,
  ];
  const kindCandidates = [
    adapterCause?.kind,
    error?.cause?.name,
    error?.name,
  ];

  const sanitize = (value, fallback) => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    return text.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || fallback;
  };

  return {
    code: sanitize(codeCandidates.find(Boolean), 'DATABASE_UNAVAILABLE'),
    kind: sanitize(kindCandidates.find(Boolean), 'DatabaseError'),
  };
}

import { randomUUID } from 'node:crypto';

export function createHealthController({ config, database, aiProvider, storageProvider }) {
  return {
    live(_req, res) { res.json({ status: 'ok' }); },

    async ready(_req, res) {
      try {
        const connected = await database.checkConnection();
        if (!connected) return res.status(503).json({ status: 'not_ready', database: 'unavailable' });
        return res.json({ status: 'ready', database: 'connected' });
      } catch (error) {
        return res.status(503).json({
          status: 'not_ready',
          database: 'unavailable',
          ...safeDatabaseDiagnostic(error),
        });
      }
    },

    async storage(_req, res) {
      const storageKey = `healthchecks/finx-${randomUUID()}.txt`;
      try {
        const uploaded = await storageProvider.upload({
          storageKey,
          buffer: Buffer.from('finx-storage-health'),
          mimeType: 'text/plain',
          metadata: { purpose: 'healthcheck' },
        });
        await storageProvider.delete({ storageKey });
        return res.json({
          status: 'ready',
          storage: storageProvider.mode,
          bucket: uploaded?.bucket || storageProvider.bucketName || null,
          write: 'ok',
          delete: 'ok',
        });
      } catch (error) {
        const code = String(error?.code || error?.errors?.[0]?.reason || 'STORAGE_UNAVAILABLE').slice(0, 80);
        return res.status(503).json({
          status: 'not_ready',
          storage: storageProvider?.mode || null,
          bucket: storageProvider?.bucketName || null,
          code,
        });
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
