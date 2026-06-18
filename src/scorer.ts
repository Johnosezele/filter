import type { AnalyzerResult, ScoreReport, SpamCheckConfig } from "./types.js";

const SIGNAL_LABELS: Record<string, string> = {
  reputation: "Contributor reputation",
  description: "PR description quality",
  diff: "Diff quality",
  ai_patterns: "AI-generation patterns",
  repo_rules: "Repository rules",
};

export function score(
  results: AnalyzerResult[],
  config: SpamCheckConfig,
): ScoreReport {
  const weightMap = config.weights;
  let weightedSum = 0;
  let totalWeight = 0;

  const signals = results.map((result) => {
    const weight = weightMap[result.id as keyof typeof weightMap] ?? 0;
    const displayScore = Math.round(result.score * 100);
    const contribution =
      weight > 0 ? Math.round(result.score * weight * 1000) / 10 : 0;

    if (weight > 0) {
      weightedSum += result.score * weight;
      totalWeight += weight;
    }

    return {
      id: result.id,
      label: SIGNAL_LABELS[result.id] ?? result.id,
      score: displayScore,
      weight: Math.round(weight * 100),
      contribution,
      reasons: result.reasons,
    };
  });

  const overall =
    totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  const tier =
    overall >= config.threshold
      ? "high"
      : overall >= config.warnThreshold
        ? "medium"
        : "low";

  return { overall, tier, signals };
}
