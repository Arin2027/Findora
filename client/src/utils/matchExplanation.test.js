import { describe, expect, test } from "vitest";
import {
  buildMatchExplanation,
  getConfidenceLabel,
  getConfidenceLevel,
  toPercent,
} from "./matchExplanation.js";

describe("matchExplanation", () => {
  test("toPercent clamps values", () => {
    expect(toPercent(0.756)).toBe(76);
    expect(toPercent(1.2)).toBe(100);
  });

  test("confidence levels", () => {
    expect(getConfidenceLevel(0.9)).toBe("high");
    expect(getConfidenceLabel(0.9)).toBe("High Confidence");
    expect(getConfidenceLevel(0.8)).toBe("medium");
    expect(getConfidenceLevel(0.6)).toBe("low");
  });

  test("buildMatchExplanation uses all signals", () => {
    const text = buildMatchExplanation({ text: 0.8, image: 0.7, location: 0.6, mode: "hybrid" }, 0.82);
    expect(text).toContain("semantically similar");
    expect(text).toContain("visually related objects");
    expect(text).toContain("nearby geographic area");
  });
});
