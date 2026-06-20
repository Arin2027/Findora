import { api } from "./http.js";

export const chatApi = {
  listConversations: () => api.get("/api/conversations"),
  create: (matchId) => api.post("/api/conversations", { matchId }),
  messages: (id) => api.get(`/api/conversations/${id}/messages`),
  send: (id, body) => api.post(`/api/conversations/${id}/messages`, body),
  markRead: (id) => api.patch(`/api/conversations/${id}/read`),
};
