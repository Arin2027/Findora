import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

function unauthorized(res, message) {
  return res.status(401).json({
    success: false,
    error: "Unauthorized",
    message,
  });
}

function forbidden(res, message) {
  return res.status(403).json({
    success: false,
    error: "Forbidden",
    message,
  });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return unauthorized(res, "Missing or invalid token");
  }
  const token = header.slice(7);
  try {
    const { JWT_SECRET } = getEnv();
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return unauthorized(res, "Invalid or expired token");
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return forbidden(res, "Admin access required");
  }
  next();
}
