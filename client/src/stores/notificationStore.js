import { create } from "zustand";
import { notificationsApi } from "../services/notificationsApi.js";

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  fetchUnread: async () => {
    try {
      const { data } = await notificationsApi.unreadCount();
      set({ unreadCount: data.count || 0 });
    } catch {
      /* ignore */
    }
  },
  increment: () => set({ unreadCount: get().unreadCount + 1 }),
  clear: () => set({ unreadCount: 0 }),
}));
