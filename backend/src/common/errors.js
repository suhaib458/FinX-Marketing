export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (resource = 'Resource') =>
  new AppError(404, 'NOT_FOUND', `${resource} was not found`);
