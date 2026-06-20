import pino from "pino";
import { getEnv } from "../config/env.js";

let logger = null;

export function getLogger() {
  if (!logger) {
    const env = getEnv();
    logger = pino({
      level: env.NODE_ENV === "production" ? "info" : "debug",
      redact: {
        paths: ["req.headers.authorization", "password", "passwordHash", "token", "refreshToken"],
        remove: true,
      },
    });
  }
  return logger;
}
