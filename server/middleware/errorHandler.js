import { getLogger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      error: "Upload Error",
      message: err.message,
    });
  }

  const status = err.statusCode || err.status || 500;
  const errorLabel =
    err.errorLabel ||
    (status >= 500 ? "Server Error" : err.name === "ValidationError" ? "Validation Error" : "Request Error");
  const message = err.message || "Internal Server Error";

  const log = getLogger();
  if (status >= 500) {
    log.error({ err, requestId: req.requestId, path: req.path, method: req.method }, message);
  } else {
    log.warn({ err: { message: err.message, name: err.name }, requestId: req.requestId }, message);
  }

  const body = {
    success: false,
    error: errorLabel,
    message,
  };
  if (err.errors) body.errors = err.errors;
  if (process.env.NODE_ENV !== "production" && status >= 500 && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: "Route not found",
  });
}
