import { aiPatternsAnalyzer } from "./ai-patterns.js";
import { descriptionAnalyzer } from "./description.js";
import { diffAnalyzer } from "./diff.js";
import { reputationAnalyzer } from "./reputation.js";
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

  const active = ANALYZER_REGISTRY.filter(({ id }) => !disabled.has(id));

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
};
