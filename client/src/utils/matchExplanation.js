/** Shared thresholds for AI confidence labels (aligned with MATCH_THRESHOLD default 0.75). */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.75,
};

export const SIGNAL_THRESHOLD = 0.4;

export function toPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.round(Math.max(0, Math.min(1, Number(value))) * 100);
}

export function getConfidenceLevel(score) {
  const s = Number(score) || 0;
  if (s >= CONFIDENCE_THRESHOLDS.HIGH) return "high";
  if (s >= CONFIDENCE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export function getConfidenceLabel(score) {
  return {
    high: "High Confidence",
    medium: "Medium Confidence",
    low: "Low Confidence",
  }[getConfidenceLevel(score)];
}

export function getConfidenceStyles(level) {
  return {
    high: "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-900/40 dark:text-emerald-200",
    medium: "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-200",
    low: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300",
  }[level];
}

export function buildMatchExplanation(breakdown = {}, score) {
  const text = breakdown.text ?? 0;
  const image = breakdown.image ?? 0;
  const location = breakdown.location ?? 0;
  const mode = breakdown.mode || "hybrid";
  const parts = [];

  if (text >= SIGNAL_THRESHOLD) {
    parts.push(
      mode === "legacy"
        ? "the item titles and descriptions share overlapping keywords"
        : "the item descriptions are semantically similar"
    );
  }

  if (image >= SIGNAL_THRESHOLD) {
    parts.push("the uploaded images contain visually related objects");
  }

  if (location >= SIGNAL_THRESHOLD) {
    parts.push("both reports were created within a nearby geographic area");
  }

  if (parts.length === 0) {
    return `This match scored ${toPercent(score)}% overall based on Findora's combined AI signals (${mode} mode), meeting the platform match threshold.`;
  }

  const joined =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
        ? `${parts[0]} and ${parts[1]}`
        : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;

  return `This match was suggested because ${joined}.`;
}

export const SCORE_SIGNALS = [
  { key: "text", label: "Text Similarity", barClass: "bg-brand-600", trackClass: "from-brand-500/20 to-brand-600/5" },
  { key: "image", label: "Image Similarity", barClass: "bg-violet-500", trackClass: "from-violet-500/20 to-violet-600/5" },
  { key: "location", label: "Location Similarity", barClass: "bg-emerald-500", trackClass: "from-emerald-500/20 to-emerald-600/5" },
];
