import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

export function signAccessToken(userId, role) {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  return jwt.sign({ sub: userId, role, type: "access" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN || "15m",
  });
}

export function signRefreshToken(userId, role) {
  const { JWT_SECRET, JWT_REFRESH_EXPIRES_IN } = getEnv();
  return jwt.sign({ sub: userId, role, type: "refresh" }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

/** @deprecated use signAccessToken */
export function signToken(userId, role) {
  return signAccessToken(userId, role);
}

export function verifyToken(token) {
  const { JWT_SECRET } = getEnv();
  return jwt.verify(token, JWT_SECRET);
}
