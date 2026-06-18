import { describe, expect, test } from "vitest";

import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import { score } from "../../src/scorer.js";
import type { AnalyzerResult } from "../../src/types.js";

/** Fixture-level spam PR: thin description + high signals across analyzers. */
const SPAM_RESULTS: AnalyzerResult[] = [
  {
    id: "reputation",
    score: 0.85,
    reasons: ["Account created within the last 7 days", "No prior contributions"],
  },
  {
    id: "description",
    score: 0.95,
    reasons: ["PR has no description", "Description matches generic phrase: \"fix bug\""],
  },
  {
    id: "diff",
    score: 0.75,
    reasons: ["Source files changed but no test files added or updated"],
  },
  {
    id: "ai_patterns",
    score: 0.7,
    reasons: ["Multiple AI-style boilerplate phrases detected"],
  },
];

const LEGIT_RESULTS: AnalyzerResult[] = [
  { id: "reputation", score: 0.15, reasons: [] },
  { id: "description", score: 0.1, reasons: [] },
  { id: "diff", score: 0.1, reasons: [] },
  { id: "ai_patterns", score: 0.05, reasons: [] },
];

describe("fixture score thresholds", () => {
  test("obvious spam fixture scores at or above 70%", () => {
    const report = score(SPAM_RESULTS, DEFAULT_CONFIG);
    expect(report.overall).toBeGreaterThanOrEqual(70);
    expect(report.tier).toBe("high");
  });

  test("legitimate fixture scores below 30%", () => {
    const report = score(LEGIT_RESULTS, DEFAULT_CONFIG);
    expect(report.overall).toBeLessThan(30);
    expect(report.tier).toBe("low");
  });
});
