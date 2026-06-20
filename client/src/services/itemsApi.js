import { api } from "./http.js";

export const itemsApi = {
  list: (params) => api.get("/api/items", { params }),
  nearby: (params) => api.get("/api/items/nearby", { params }),
  mine: (params) => api.get("/api/items/mine", { params }),
  get: (id) => api.get(`/api/items/${id}`),
  create: (formData) => api.post("/api/items", formData),
  update: (id, formData) => api.patch(`/api/items/${id}`, formData),
  delete: (id) => api.delete(`/api/items/${id}`),
};
