import { resolvePhrases } from "./phrases.js";
import type { Analyzer } from "../types.js";
import {
  clamp01,
  countWords,
  hasIssueReference,
  levenshteinRatio,
} from "../utils/text.js";

export const descriptionAnalyzer: Analyzer = async (ctx) => {
  const reasons: string[] = [];
  let score = 0;

  const body = ctx.pr.body ?? "";
  const title = ctx.pr.title;
  const combined = `${title}\n${body}`.toLowerCase();
  const wordCount = countWords(body);

  if (!body || wordCount < 20) {
    score += wordCount < 20 && wordCount >= 1 ? 0.25 : 0.5;
    reasons.push(
      wordCount === 0
        ? "PR has no description"
        : "PR description is very short (< 20 words)",
    );
  } else if (wordCount < 50) {
    score += 0.25;
    reasons.push("PR description is short (< 50 words)");
  }

  if (wordCount >= 150 && hasIssueReference(body)) {
    score -= 0.2;
  }

  const { genericPhrases } = resolvePhrases(ctx.config.phrases);

  let phraseHits = 0;
  for (const phrase of genericPhrases) {
    if (combined.includes(phrase)) {
      phraseHits++;
      if (phraseHits <= 3) {
        reasons.push(`Description matches generic phrase: "${phrase}"`);
      }
    }
  }
  score += Math.min(phraseHits * 0.15, 0.45);

  if (body && levenshteinRatio(body.trim(), title.trim()) > 0.85) {
    score += 0.3;
    reasons.push("Description substantially equals the PR title");
  }

  if (/\b(test|testing|npm test)\b/i.test(body) || /- \[ \]/.test(body)) {
    score -= 0.15;
  }

  const headingCount = (body.match(/^##\s+/gm) ?? []).length;
  if (headingCount >= 2) {
    score -= 0.1;
  }

  return {
    id: "description",
    score: clamp01(score),
    reasons,
  };
};
