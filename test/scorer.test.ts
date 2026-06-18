import { describe, expect, test } from "vitest";

import { score } from "../src/scorer.js";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import type { AnalyzerResult } from "../src/types.js";

describe("score", () => {
  test("computes weighted overall score and tier", () => {
    const results: AnalyzerResult[] = [
      { id: "reputation", score: 0.8, reasons: ["new account"] },
      { id: "description", score: 0.9, reasons: ["thin description"] },
      { id: "diff", score: 0.7, reasons: ["no tests"] },
      { id: "ai_patterns", score: 0.6, reasons: ["boilerplate"] },
    ];

    const report = score(results, DEFAULT_CONFIG);

    expect(report.overall).toBeGreaterThanOrEqual(70);
    expect(report.tier).toBe("high");
    expect(report.signals).toHaveLength(4);
  });

  test("marks low-risk PRs as passed tier", () => {
    const results: AnalyzerResult[] = [
      { id: "reputation", score: 0.1, reasons: [] },
      { id: "description", score: 0.1, reasons: [] },
      { id: "diff", score: 0.1, reasons: [] },
      { id: "ai_patterns", score: 0.1, reasons: [] },
    ];

    const report = score(results, DEFAULT_CONFIG);

    expect(report.overall).toBeLessThan(30);
    expect(report.tier).toBe("low");
  });

  test("ignores analyzers with zero weight", () => {
    const config = {
      ...DEFAULT_CONFIG,
      weights: { ...DEFAULT_CONFIG.weights, repo_rules: 0 },
    };
    const results: AnalyzerResult[] = [
      { id: "repo_rules", score: 1, reasons: ["broken rule"] },
      { id: "description", score: 0.2, reasons: [] },
      { id: "diff", score: 0.2, reasons: [] },
      { id: "reputation", score: 0.2, reasons: [] },
      { id: "ai_patterns", score: 0.2, reasons: [] },
    ];

    const report = score(results, config);
    expect(report.signals.find((s) => s.id === "repo_rules")?.contribution).toBe(
      0,
    );
  });
});
