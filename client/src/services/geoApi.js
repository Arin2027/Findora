import { api } from "./http.js";

export const geoApi = {
  search: (q) => api.get("/api/geo/search", { params: { q, limit: 6 } }),
};
