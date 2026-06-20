import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { registerChatHandlers } from "./handlers/chat.handler.js";
import { presenceStore } from "./presence.js";
import { getLogger } from "../utils/logger.js";

export function createSocketServer(httpServer) {
  const { CLIENT_URL, JWT_SECRET } = getEnv();
  const log = getLogger();

  const io = new Server(httpServer, {
    cors: { origin: CLIENT_URL, credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || "").replace("Bearer ", "");
      if (!token) return next(new Error("Unauthorized"));
      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    log.debug({ userId, socketId: socket.id }, "Socket connected");
    socket.join(`user:${userId}`);
    presenceStore.setOnline(userId, socket.id);
    io.emit("user:online", { userId });

    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      presenceStore.setOffline(userId, socket.id);
      io.emit("user:offline", { userId });
    });
  });

  return io;
}
