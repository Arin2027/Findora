import { api } from "./http.js";

export const matchesApi = {
  list: () => api.get("/api/matches"),
  get: (id) => api.get(`/api/matches/${id}`),
  claim: (id, note) => api.post(`/api/matches/${id}/claim`, { note }),
  reviewClaim: (id, action) => api.patch(`/api/matches/${id}/claim/review`, { action }),
  dismiss: (id) => api.patch(`/api/matches/${id}/dismiss`),
};
