import type { Analyzer } from "../types.js";
import { clamp01, hasIssueReference } from "../utils/text.js";

const SOURCE_PATH =
  /(?:^|\/)(?:src|lib|app|pkg|internal|cmd|crates)\/|\.(?:ts|tsx|js|jsx|py|go|rs|java|rb|php|cs)$/i;
const TEST_PATH =
  /(?:^|\/)(?:test|tests|__tests__|spec)\/|\.(?:test|spec)\.[a-z]+$/i;

function topLevelDir(filename: string): string {
  const parts = filename.split("/");
  return parts.length > 1 ? (parts[0] ?? "") : ".";
}

function analyzePatch(patch: string | undefined): {
  totalLines: number;
  whitespaceLines: number;
} {
  if (!patch) return { totalLines: 0, whitespaceLines: 0 };

  let totalLines = 0;
  let whitespaceLines = 0;

  for (const line of patch.split("\n")) {
    if (!line.startsWith("+") && !line.startsWith("-")) continue;
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    totalLines++;
    const content = line.slice(1);
    if (content.trim() === "") whitespaceLines++;
  }

  return { totalLines, whitespaceLines };
}

export const diffAnalyzer: Analyzer = async (ctx) => {
  const reasons: string[] = [];
  let score = 0;

  const files = await ctx.octokit.paginate(
    ctx.octokit.rest.pulls.listFiles,
    {
      owner: ctx.owner,
      repo: ctx.repo,
      pull_number: ctx.pullNumber,
      per_page: 100,
    },
  );

  if (files.length > 100) {
    reasons.push("Diff has more than 100 files — analysis capped");
  }

  let totalChanged = 0;
  let whitespaceChanged = 0;
  let hasSource = false;
  let hasTest = false;
  let onlyDocs = true;

  const topDirs = new Set<string>();

  for (const file of files) {
    topDirs.add(topLevelDir(file.filename));
    if (SOURCE_PATH.test(file.filename)) hasSource = true;
    if (TEST_PATH.test(file.filename)) hasTest = true;
    if (!/\.(?:md|markdown|txt|rst)$/i.test(file.filename)) {
      onlyDocs = false;
    }

    const { totalLines, whitespaceLines } = analyzePatch(file.patch);
    totalChanged += totalLines;
    whitespaceChanged += whitespaceLines;
  }

  if (totalChanged > 0 && whitespaceChanged / totalChanged > 0.8) {
    score += 0.4;
    reasons.push("Most changed lines are whitespace-only");
  }

  if (hasSource && !hasTest) {
    score += 0.35;
    reasons.push("Source files changed but no test files added or updated");
  }

  const bodyLen = (ctx.pr.body ?? "").length;
  if (topDirs.size >= 3 && bodyLen < 100) {
    score += 0.25;
    reasons.push("Changes span many directories with a thin description");
  }

  if (onlyDocs && files.length > 0 && !hasIssueReference(ctx.pr.body ?? "")) {
    score += 0.2;
    reasons.push("Only documentation changed with no issue reference");
  }

  const primaryDir = topDirs.size === 1 ? [...topDirs][0] : null;
  if (files.length <= 5 && primaryDir && hasTest) {
    score -= 0.2;
  }

  return {
    id: "diff",
    score: clamp01(score),
    reasons,
    metadata: { fileCount: files.length, totalChanged },
  };
};
