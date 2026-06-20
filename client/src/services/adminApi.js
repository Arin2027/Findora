import { api } from "./http.js";

export const adminApi = {
  users: () => api.get("/api/admin/users"),
  updateUser: (id, data) => api.patch(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  items: (params) => api.get("/api/admin/items", { params }),
  deleteItem: (id) => api.delete(`/api/admin/items/${id}`),
  flagItem: (id, reason) => api.patch(`/api/admin/items/${id}/flag`, { reason }),
  analyticsOverview: () => api.get("/api/admin/analytics/overview"),
  analyticsCategories: () => api.get("/api/admin/analytics/categories"),
  analyticsLocations: () => api.get("/api/admin/analytics/locations"),
  analyticsMatches: () => api.get("/api/admin/analytics/matches"),
  exportReport: () => api.get("/api/admin/analytics/export"),
};
