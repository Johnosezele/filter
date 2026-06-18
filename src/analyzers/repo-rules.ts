import type { Analyzer } from "../types.js";
import { clamp01, hasIssueReference } from "../utils/text.js";
import { matchGlob } from "../utils/glob.js";

export const repoRulesAnalyzer: Analyzer = async (ctx) => {
  const rules = ctx.config.rules;
  const reasons: string[] = [];
  let score = 0;
  const body = ctx.pr.body ?? "";

  if (rules.require_issue_reference && !hasIssueReference(body)) {
    score += 0.5;
    reasons.push("PR description is missing an issue reference");
  }

  const needsFiles =
    rules.min_diff_lines !== undefined ||
    (rules.forbidden_paths?.length ?? 0) > 0;

  const files = needsFiles
    ? await ctx.octokit.paginate(ctx.octokit.rest.pulls.listFiles, {
        owner: ctx.owner,
        repo: ctx.repo,
        pull_number: ctx.pullNumber,
        per_page: 100,
      })
    : [];

  if (rules.min_diff_lines !== undefined) {
    const totalLines = files.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0,
    );
    if (totalLines < rules.min_diff_lines) {
      score += 0.4;
      reasons.push(
        `Diff has fewer than ${rules.min_diff_lines} changed lines (${totalLines})`,
      );
    }
  }

  for (const section of rules.required_sections ?? []) {
    if (!body.includes(section)) {
      score += 0.25;
      reasons.push(`Missing required section: ${section}`);
    }
  }

  for (const phrase of rules.forbidden_phrases ?? []) {
    if (body.toLowerCase().includes(phrase.toLowerCase())) {
      score += 0.3;
      reasons.push(`Description contains forbidden phrase: "${phrase}"`);
    }
  }

  for (const pattern of rules.forbidden_paths ?? []) {
    for (const file of files) {
      if (matchGlob(pattern, file.filename)) {
        score += 0.35;
        reasons.push(`Touches forbidden path pattern "${pattern}": ${file.filename}`);
      }
    }
  }

  return {
    id: "repo_rules",
    score: clamp01(score),
    reasons,
  };
};
