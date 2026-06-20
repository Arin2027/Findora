import { api } from "./http.js";

export const notificationsApi = {
  list: () => api.get("/api/notifications"),
  unreadCount: () => api.get("/api/notifications/unread-count"),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/notifications/read-all"),
};
