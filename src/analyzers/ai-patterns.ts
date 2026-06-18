import { resolveEmojiPatterns, resolvePhrases, matchSpamEmojis } from "./phrases.js";
import type { Analyzer } from "../types.js";
import {
  clamp01,
  countEmojis,
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
  const combined = `${ctx.pr.title}\n${ctx.pr.body ?? ""}\n${commitMessages}`;
  const combinedLower = combined.toLowerCase();
  const { aiPhrases, transitionWords, pleasantryPattern } = resolvePhrases(
    ctx.config.phrases,
  );
  const emojiPatterns = resolveEmojiPatterns(ctx.config.phrases.emoji_patterns);

  let phraseHits = 0;
  for (const phrase of aiPhrases) {
    if (combinedLower.includes(phrase)) phraseHits++;
  }
  if (phraseHits >= 3) {
    score += 0.35;
    reasons.push("Multiple AI-style boilerplate phrases detected");
  }

  const iStarts = sentencesStartingWithI(combinedLower);
  if (iStarts >= 4) {
    score += 0.2;
    reasons.push("Many sentences start with first-person phrasing");
  }

  const transitions = combinedLower.match(transitionWords) ?? [];
  if (transitions.length >= 3) {
    score += 0.25;
    reasons.push("High density of formal transition words");
  }

  const stdDev = sentenceLengthStdDev(combinedLower);
  if (countWords(combinedLower) >= 40 && stdDev > 0 && stdDev < 4) {
    score += 0.2;
    reasons.push("Unusually uniform sentence length");
  }

  if (pleasantryPattern.test(combinedLower)) {
    score += 0.15;
    reasons.push("Closing pleasantry common in LLM-generated text");
  }

  if (emojiPatterns.enabled) {
    const emojiHits = matchSpamEmojis(combined, emojiPatterns.spamEmojis);
    if (emojiHits.length >= emojiPatterns.minListMatches) {
      score += 0.25;
      reasons.push(
        `Spam/AI emoji patterns detected: ${emojiHits.join(" ")}`,
      );
    }

    const emojiCount = countEmojis(combined);
    if (emojiCount >= emojiPatterns.minCount) {
      score += 0.2;
      reasons.push(
        `High emoji density in PR text (${emojiCount} emojis)`,
      );
    }
  }

  return {
    id: "ai_patterns",
    score: clamp01(score),
    reasons,
  };
};
