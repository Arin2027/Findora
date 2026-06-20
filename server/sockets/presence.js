const onlineUsers = new Map();

export const presenceStore = {
  setOnline(userId, socketId) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
  },
  setOffline(userId, socketId) {
    const set = onlineUsers.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) onlineUsers.delete(userId);
  },
  isOnline(userId) {
    return onlineUsers.has(userId);
  },
  getOnlineUserIds() {
    return [...onlineUsers.keys()];
  },
};
