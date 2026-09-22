import { AppError } from '../common/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} was not found`));
}

export function errorHandler(logger) {
  return (error, req, res, _next) => {
    let normalized = error;
    if (error instanceof SyntaxError && (error.type === 'entity.parse' || error.status === 400)) {
      normalized = new AppError(400, 'MALFORMED_JSON', 'Request body contains malformed JSON');
    } else if (error.type === 'entity.too.large') {
      normalized = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the configured limit');
    } else if (error.message === 'CORS_ORIGIN_DENIED') {
      normalized = new AppError(403, 'CORS_FORBIDDEN', 'Origin is not allowed');
    } else if (error.code === 'P2002') {
      normalized = new AppError(409, 'CONFLICT', 'A resource with the same unique value already exists');
    } else if (!(error instanceof AppError)) {
      normalized = new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
    }

    if (normalized.status >= 500) {
      logger.error({ requestId: req.id, err: error }, 'request failed');
    }

    const body = {
      error: {
        code: normalized.code,
        message: normalized.message,
        requestId: req.id,
      },
    };
    if (normalized.details) body.error.details = normalized.details;
    res.status(normalized.status).json(body);
  };
}
