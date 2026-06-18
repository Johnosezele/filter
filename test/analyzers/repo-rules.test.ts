import { describe, expect, test } from "vitest";

import { repoRulesAnalyzer } from "../../src/analyzers/repo-rules.js";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import type { AnalyzerContext } from "../../src/types.js";

function makeCtx(
  overrides: Partial<AnalyzerContext["pr"]> & {
    rules?: AnalyzerContext["config"]["rules"];
    files?: Array<{
      filename: string;
      additions: number;
      deletions: number;
    }>;
  },
): AnalyzerContext {
  const files = overrides.files ?? [
    { filename: "README.md", additions: 1, deletions: 0 },
  ];

  return {
    owner: "test-org",
    repo: "filter",
    pullNumber: 1,
    pr: {
      title: overrides.title ?? "Update docs",
      body: overrides.body ?? "Updates documentation.",
      user: { login: "contributor" },
      head: { sha: "abc", ref: "feature" },
      base: { ref: "main" },
    },
    octokit: {
      paginate: async () => files,
      rest: {
        pulls: {
          listFiles: {},
        },
      },
    } as unknown as AnalyzerContext["octokit"],
    config: {
      ...DEFAULT_CONFIG,
      weights: { ...DEFAULT_CONFIG.weights, repo_rules: 0.2 },
      rules: overrides.rules ?? {},
    },
  };
}

describe("repoRulesAnalyzer", () => {
  test("flags missing issue reference", async () => {
    const result = await repoRulesAnalyzer(
      makeCtx({
        rules: { require_issue_reference: true },
        body: "No issue link here.",
      }),
    );

    expect(result.score).toBeGreaterThanOrEqual(0.5);
    expect(result.reasons).toContain(
      "PR description is missing an issue reference",
    );
  });

  test("flags missing required sections and forbidden phrases", async () => {
    const result = await repoRulesAnalyzer(
      makeCtx({
        body: "Includes hacktoberfest mention.",
        rules: {
          required_sections: ["## Testing"],
          forbidden_phrases: ["hacktoberfest"],
        },
      }),
    );

    expect(result.reasons).toContain("Missing required section: ## Testing");
    expect(result.reasons).toContain(
      'Description contains forbidden phrase: "hacktoberfest"',
    );
  });

  test("flags forbidden path globs", async () => {
    const result = await repoRulesAnalyzer(
      makeCtx({
        rules: { forbidden_paths: ["docs/sponsors/**"] },
        files: [{ filename: "docs/sponsors/foo.md", additions: 2, deletions: 0 }],
      }),
    );

    expect(result.reasons.some((r) => r.includes("forbidden path"))).toBe(true);
  });
});
