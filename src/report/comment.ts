import type { ProbotOctokit } from "probot";

import { COMMENT_MARKER } from "../constants.js";
import type { ScoreReport, ScoreTier, SpamCheckConfig } from "../types.js";

function tierHeading(tier: ScoreTier, overall: number): string {
  switch (tier) {
    case "high":
      return `**Overall score: ${overall}% — High risk** (merge blocked)`;
    case "medium":
      return `**Overall score: ${overall}% — Medium risk** (review recommended)`;
    default:
      return `**Overall score: ${overall}% — Low risk**`;
  }
}

export function shouldComment(
  report: ScoreReport,
  config: SpamCheckConfig,
): boolean {
  return config.alwaysComment || report.overall >= config.warnThreshold;
}

export function buildComment(report: ScoreReport): string {
  const activeSignals = report.signals.filter((signal) => signal.weight > 0);

  const tableRows = activeSignals
    .map(
      (signal) =>
        `| ${signal.label} | ${signal.score}% | ${signal.weight}% | ${signal.contribution.toFixed(1)}% |`,
    )
    .join("\n");

  const reasons = [
    ...new Set(
      activeSignals.flatMap((signal) => signal.reasons).filter(Boolean),
    ),
  ];

  const reasonBlock =
    reasons.length > 0
      ? `**Why this PR was flagged:**\n${reasons.map((r) => `- ${r}`).join("\n")}`
      : "_No specific issues detected._";

  return `${COMMENT_MARKER}
## PR Spam Checker

${tierHeading(report.tier, report.overall)}

| Signal | Score | Weight | Contribution |
|--------|-------|--------|--------------|
${tableRows}

${reasonBlock}

_Maintainers: comment \`/spam-override\` to unlock the merge gate._
_Contributors: push updates to re-run checks, or ask a maintainer to \`/spam-recheck\`._`;
}

export async function upsertSpamCheckComment(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<void> {
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  });

  const existing = comments.find((comment) =>
    comment.body?.includes(COMMENT_MARKER),
  );

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return;
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}
