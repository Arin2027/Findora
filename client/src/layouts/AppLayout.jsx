import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Moon, Sun, Bell, LayoutDashboard, MessageCircle, Sparkles, Map, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { useThemeStore } from "../stores/themeStore.js";
import { useNotificationStore } from "../stores/notificationStore.js";
import { useSocket } from "../hooks/useSocket.js";
import { fadeIn } from "../animations/variants.js";

const navClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
    isActive
      ? "bg-brand-600/90 text-white shadow-md"
      : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
  }`;

const dashNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/matches", label: "Matches", icon: Sparkles },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/post", label: "Post item", icon: PlusCircle },
  { to: "/map", label: "Map", icon: Map },
];

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggle, init } = useThemeStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const location = useLocation();
  useSocket();

  useEffect(() => {
    init();
  }, [init]);

  const showSidebar = user && !["/", "/login", "/register"].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-white/40 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-display text-xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">
            Findora
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" className={navClass} end>
              Home
            </NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/matches" className={navClass}>
                  Matches
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <Link
                to="/dashboard"
                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <>
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:inline max-w-[140px] truncate">
                  {user.email}
                </span>
                <button type="button" onClick={logout} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600">
                  Log in
                </Link>
                <Link to="/register" className="rounded-xl bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 shadow-lg shadow-brand-600/25">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {showSidebar && (
          <aside className="hidden lg:flex w-56 flex-col gap-1 p-4 border-r border-white/30 dark:border-slate-800/50">
            {dashNav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navClass}>
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </aside>
        )}
        <main className="flex-1 px-4 py-8 w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} {...fadeIn}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <footer className="border-t border-slate-200/50 dark:border-slate-800 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Findora — AI-powered lost &amp; found platform
      </footer>
    </div>
  );
}
