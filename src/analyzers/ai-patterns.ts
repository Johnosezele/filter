import { resolvePhrases } from "./phrases.js";
import type { Analyzer } from "../types.js";
import {
  clamp01,
  countWords,
  sentenceLengthStdDev,
} from "../utils/text.js";

function sentencesStartingWithI(text: string): number {
  return (text.match(/\bI(?:'ve| have)?\s/gi) ?? []).length;
}

export const aiPatternsAnalyzer: Analyzer = async (ctx) => {
  const reasons: string[] = [];
  let score = 0;

  const { data: commits } = await ctx.octokit.rest.pulls.listCommits({
    owner: ctx.owner,
    repo: ctx.repo,
    pull_number: ctx.pullNumber,
    per_page: 100,
  });

  const commitMessages = commits
    .map((c) => c.commit.message)
    .filter(Boolean)
    .join("\n");
  const combined = `${ctx.pr.body ?? ""}\n${commitMessages}`.toLowerCase();
  const { aiPhrases, transitionWords, pleasantryPattern } = resolvePhrases(
    ctx.config.phrases,
  );

  let phraseHits = 0;
  for (const phrase of aiPhrases) {
    if (combined.includes(phrase)) phraseHits++;
  }
  if (phraseHits >= 3) {
    score += 0.35;
    reasons.push("Multiple AI-style boilerplate phrases detected");
  }

  const iStarts = sentencesStartingWithI(combined);
  if (iStarts >= 4) {
    score += 0.2;
    reasons.push("Many sentences start with first-person phrasing");
  }

  const transitions = combined.match(transitionWords) ?? [];
  if (transitions.length >= 3) {
    score += 0.25;
    reasons.push("High density of formal transition words");
  }

  const stdDev = sentenceLengthStdDev(combined);
  if (countWords(combined) >= 40 && stdDev > 0 && stdDev < 4) {
    score += 0.2;
    reasons.push("Unusually uniform sentence length");
  }

  if (pleasantryPattern.test(combined)) {
    score += 0.15;
    reasons.push("Closing pleasantry common in LLM-generated text");
  }

  return {
    id: "ai_patterns",
    score: clamp01(score),
    reasons,
  };
};
