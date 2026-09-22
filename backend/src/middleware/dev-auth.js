import { AppError } from '../common/errors.js';

export function devAuth(config, userService) {
  return async (req, _res, next) => {
    try {
      if (!config.allowDevAuth || config.isProduction) {
        throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required');
      }
      const userId = req.get('x-finx-dev-user-id');
      if (!userId) throw new AppError(401, 'AUTH_REQUIRED', 'Development user header is required');
      const user = await userService.authenticateDevelopmentUser(userId);
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
