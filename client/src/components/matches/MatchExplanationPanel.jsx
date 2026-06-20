import {
  buildMatchExplanation,
  getConfidenceLabel,
  getConfidenceLevel,
  getConfidenceStyles,
  SCORE_SIGNALS,
  toPercent,
} from "../../utils/matchExplanation.js";

function ScoreProgressBar({ label, value, barClass, trackClass }) {
  const pct = toPercent(value);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-semibold tabular-nums dark:text-white">{pct}%</span>
      </div>
      <div className={`h-2.5 rounded-full bg-gradient-to-r ${trackClass} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
    </div>
  );
}

export function MatchExplanationPanel({ match }) {
  const breakdown = match.scoreBreakdown || {};
  const score = match.score ?? breakdown.final ?? 0;
  const confidenceLevel = getConfidenceLevel(score);
  const confidenceLabel = getConfidenceLabel(score);
  const explanation = buildMatchExplanation(breakdown, score);
  const overallPct = toPercent(score);

  return (
    <div className="mt-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/40 p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            AI Match Analysis
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-brand-600">{overallPct}%</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Overall Match Score</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getConfidenceStyles(confidenceLevel)}`}
        >
          {confidenceLabel}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {SCORE_SIGNALS.map(({ key, label, barClass, trackClass }) => {
          const pct = toPercent(breakdown[key]);
          return (
            <div
              key={key}
              className="rounded-xl border border-white/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/50 p-3 text-center shadow-sm"
            >
              <p className="text-2xl font-bold tabular-nums dark:text-white">{pct}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label.replace(" Similarity", "")}</p>
              <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${trackClass} overflow-hidden`}>
                <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {SCORE_SIGNALS.map(({ key, label, barClass, trackClass }) => (
          <ScoreProgressBar
            key={key}
            label={label}
            value={breakdown[key]}
            barClass={barClass}
            trackClass={trackClass}
          />
        ))}
      </div>

      <div className="rounded-xl border border-brand-200/60 dark:border-brand-800/40 bg-brand-50/50 dark:bg-brand-950/20 p-4">
        <h4 className="text-sm font-semibold text-brand-800 dark:text-brand-200 mb-2 flex items-center gap-2">
          <span aria-hidden="true">✨</span> Explain Match
        </h4>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{explanation}</p>
        {breakdown.mode && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            Matching mode: <span className="font-medium capitalize">{breakdown.mode}</span>
            {" · "}
            Weights: text 40% · image 40% · location 20%
          </p>
        )}
      </div>
    </div>
  );
}
