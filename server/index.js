import "dotenv/config";
import http from "http";
import { getEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { createSocketServer } from "./sockets/index.js";
import { getLogger } from "./utils/logger.js";

async function main() {
  const env = getEnv();
  const log = getLogger();

  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);
  app.set("io", io);

  server.listen(env.PORT, () => {
    log.info({ port: env.PORT, env: env.NODE_ENV }, "Findora API listening");
  });
}

main().catch((err) => {
  getLogger().fatal({ err }, "Failed to start server");
  process.exit(1);
});
