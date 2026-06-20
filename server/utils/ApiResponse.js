export class ApiResponse {
  static success(res, data, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data });
  }

  static ok(res, data) {
    return ApiResponse.success(res, data, 200);
  }

  static created(res, data) {
    return ApiResponse.success(res, data, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }

  /** Backward-compatible error shape: { success, error, message, errors? } */
  static error(res, { statusCode = 500, error = "Server Error", message, errors }) {
    const body = { success: false, error, message: message || error };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  }
}
