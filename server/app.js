import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { getEnv } from "./config/env.js";
import { ensureUploadDir } from "./middleware/upload.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { sanitizeMiddleware } from "./middleware/sanitize.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { initCloudinary } from "./services/cloudinary.service.js";
import { getHealthReport } from "./services/health.service.js";

import authRoutes from "./modules/auth/auth.routes.js";
import itemRoutes from "./modules/items/items.routes.js";
import matchRoutes from "./modules/matches/matches.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import geoRoutes from "./modules/geo/geo.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const env = getEnv();
  initCloudinary();

  const app = express();
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(globalRateLimiter);
  app.use(sanitizeMiddleware);
  app.use(express.json({ limit: "1mb" }));

  const uploadDir = ensureUploadDir();
  app.use("/uploads", express.static(uploadDir));

  app.get("/api/health/live", (_req, res) => {
    res.json({ ok: true, status: "alive" });
  });

  app.get("/api/health/ready", async (_req, res) => {
    const report = await getHealthReport({ deep: true });
    res.status(report.ok ? 200 : 503).json(report);
  });

  app.get("/api/health", async (_req, res) => {
    const report = await getHealthReport({ deep: false });
    res.status(report.ok ? 200 : 503).json(report);
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/items", itemRoutes);
  app.use("/api/matches", matchRoutes);
  app.use("/api/conversations", chatRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/geo", geoRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
