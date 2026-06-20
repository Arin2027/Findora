export class AppError extends Error {
  constructor(message, statusCode = 500, errorLabel = "Request Error") {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.errorLabel = errorLabel;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors) {
    const err = new AppError(message, 400, "Validation Error");
    err.errors = errors;
    return err;
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, "Unauthorized");
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, "Forbidden");
  }

  static notFound(message = "Not Found") {
    return new AppError(message, 404, "Not Found");
  }

  static conflict(message) {
    return new AppError(message, 409, "Conflict");
  }
}
