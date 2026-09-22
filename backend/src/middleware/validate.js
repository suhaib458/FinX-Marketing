import { AppError } from '../common/errors.js';

export function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[location]);
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', details));
      }
      validated[location] = result.data;
    }
    req.validated = { ...req.validated, ...validated };
    next();
  };
}
