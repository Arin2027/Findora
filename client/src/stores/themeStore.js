import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("findora-theme") || "light",
  toggle: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      localStorage.setItem("findora-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return { theme: next };
    }),
  init: () => {
    const theme = localStorage.getItem("findora-theme") || "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
}));
