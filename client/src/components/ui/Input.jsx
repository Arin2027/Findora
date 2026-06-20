export function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">{label}</span>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition ${className}`}
        {...props}
      />
    </label>
  );
}
