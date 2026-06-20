import { presenceStore } from "../presence.js";

export function registerChatHandlers(io, socket) {
  socket.on("conversation:join", (conversationId) => {
    if (conversationId) socket.join(`conversation:${conversationId}`);
  });

  socket.on("conversation:leave", (conversationId) => {
    if (conversationId) socket.leave(`conversation:${conversationId}`);
  });

  socket.on("typing:start", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("typing:start", {
      conversationId,
      userId: socket.user.id,
    });
  });

  socket.on("typing:stop", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("typing:stop", {
      conversationId,
      userId: socket.user.id,
    });
  });

  socket.on("presence:check", (userIds, cb) => {
    const result = {};
    for (const id of userIds || []) {
      result[id] = presenceStore.isOnline(id);
    }
    if (typeof cb === "function") cb(result);
  });
}
