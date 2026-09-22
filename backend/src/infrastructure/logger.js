import pino from 'pino';

export function createLogger(config) {
  return pino({
    level: config.logLevel,
    base: { service: 'finx-backend', version: config.version, environment: config.nodeEnv },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.x-api-key',
        '*.password',
        '*.token',
        '*.secret',
        '*.databaseUrl',
      ],
      censor: '[REDACTED]',
    },
  });
}
