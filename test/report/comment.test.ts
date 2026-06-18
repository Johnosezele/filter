import { describe, expect, test } from "vitest";

import { COMMENT_MARKER } from "../../src/constants.js";
import {
  buildComment,
  shouldComment,
} from "../../src/report/comment.js";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import type { ScoreReport } from "../../src/types.js";

const sampleReport: ScoreReport = {
  overall: 78,
  tier: "high",
  signals: [
    {
      id: "description",
      label: "PR description quality",
      score: 90,
      weight: 30,
      contribution: 27,
      reasons: ["PR has no description"],
    },
    {
      id: "diff",
      label: "Diff quality",
      score: 80,
      weight: 30,
      contribution: 24,
      reasons: ["Source files changed but no test files added or updated"],
    },
    {
      id: "repo_rules",
      label: "Repository rules",
      score: 50,
      weight: 0,
      contribution: 0,
      reasons: ["Missing required section: ## Testing"],
    },
  ],
};

describe("buildComment", () => {
  test("includes marker, table, and flagged reasons", () => {
    const body = buildComment(sampleReport);

    expect(body.startsWith(COMMENT_MARKER)).toBe(true);
    expect(body).toContain("Overall score: 78% — High risk");
    expect(body).toContain("| PR description quality | 90% | 30% | 27.0% |");
    expect(body).not.toContain("Repository rules");
    expect(body).toContain("PR has no description");
    expect(body).toContain("/spam-override");
  });
});

describe("shouldComment", () => {
  test("comments when score is at or above warn threshold", () => {
    expect(
      shouldComment({ ...sampleReport, overall: 30, tier: "medium" }, DEFAULT_CONFIG),
    ).toBe(true);
  });

  test("skips comment for low scores unless always_comment", () => {
    expect(
      shouldComment({ ...sampleReport, overall: 8, tier: "low" }, DEFAULT_CONFIG),
    ).toBe(false);
    expect(
      shouldComment(
        { ...sampleReport, overall: 8, tier: "low" },
        { ...DEFAULT_CONFIG, alwaysComment: true },
      ),
    ).toBe(true);
  });
});
