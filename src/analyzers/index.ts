import { aiPatternsAnalyzer } from "./ai-patterns.js";
import { descriptionAnalyzer } from "./description.js";
import { diffAnalyzer } from "./diff.js";
import { reputationAnalyzer } from "./reputation.js";
import { repoRulesAnalyzer } from "./repo-rules.js";
import type { Analyzer, AnalyzerContext, AnalyzerResult } from "../types.js";

const ANALYZER_REGISTRY: Array<{ id: string; run: Analyzer }> = [
  { id: "reputation", run: reputationAnalyzer },
  { id: "description", run: descriptionAnalyzer },
  { id: "diff", run: diffAnalyzer },
  { id: "ai_patterns", run: aiPatternsAnalyzer },
];

export async function runAnalyzers(
  ctx: AnalyzerContext,
): Promise<AnalyzerResult[]> {
  const disabled = new Set(
    ctx.config.disabledAnalyzers.map((id) => id.toLowerCase()),
  );

  const registry = [...ANALYZER_REGISTRY];
  if (ctx.config.weights.repo_rules > 0) {
    registry.push({ id: "repo_rules", run: repoRulesAnalyzer });
  }

  const active = registry.filter(({ id }) => !disabled.has(id));

  return Promise.all(
    active.map(async ({ id, run }) => {
      try {
        return await run(ctx);
      } catch {
        return {
          id,
          score: 0,
          reasons: ["Analyzer failed — skipped"],
        };
      }
    }),
  );
}

export {
  reputationAnalyzer,
  descriptionAnalyzer,
  diffAnalyzer,
  aiPatternsAnalyzer,
  repoRulesAnalyzer,
};
