import mongoSanitize from "express-mongo-sanitize";
import { getLogger } from "../utils/logger.js";

export const sanitizeMiddleware = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    getLogger().warn({ key, method: req.method, path: req.path, requestId: req.requestId }, "Sanitized request field");
  },
});
