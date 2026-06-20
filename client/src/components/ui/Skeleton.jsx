export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/50 ${className}`}
      aria-hidden
    />
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/50">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
