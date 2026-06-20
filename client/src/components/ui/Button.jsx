const variants = {
  primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/20",
  secondary: "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
  ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
