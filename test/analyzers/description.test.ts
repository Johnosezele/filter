import { describe, expect, test } from "vitest";

import { descriptionAnalyzer } from "../../src/analyzers/description.js";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import type { AnalyzerContext } from "../../src/types.js";

function makeCtx(overrides: {
  title?: string;
  body?: string | null;
}): AnalyzerContext {
  return {
    owner: "test-org",
    repo: "filter",
    pullNumber: 1,
    pr: {
      title: overrides.title ?? "fix bug",
      body: overrides.body ?? "fix bug",
      user: { login: "spammer" },
      head: { sha: "abc", ref: "spam" },
      base: { ref: "main" },
    },
    octokit: {} as AnalyzerContext["octokit"],
    config: DEFAULT_CONFIG,
  };
}

describe("descriptionAnalyzer", () => {
  test("flags obvious spam descriptions", async () => {
    const result = await descriptionAnalyzer(
      makeCtx({
        title: "fix bug",
        body: "fix bug",
      }),
    );

    expect(result.score).toBeGreaterThanOrEqual(0.7);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test("scores legitimate descriptions lower", async () => {
    const result = await descriptionAnalyzer(
      makeCtx({
        title: "Add rate limiting to webhook handler",
        body: `## Summary

Fixes #42. Adds exponential backoff when GitHub returns 429 responses.

## Testing

- [x] npm test
- [x] Manual webhook replay against smee.io`,
      }),
    );

    expect(result.score).toBeLessThan(0.3);
  });
});
