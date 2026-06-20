import { motion } from "framer-motion";

export function Card({ children, className = "", glass = true, ...motionProps }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border ${
        glass
          ? "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-black/30"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
      } ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
