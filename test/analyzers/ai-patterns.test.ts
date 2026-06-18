import { describe, expect, test } from "vitest";

import { aiPatternsAnalyzer } from "../../src/analyzers/ai-patterns.js";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import type { AnalyzerContext } from "../../src/types.js";

function makeCtx(
  overrides: Partial<AnalyzerContext["pr"]> & {
    phrases?: AnalyzerContext["config"]["phrases"];
    commits?: string[];
  },
): AnalyzerContext {
  return {
    owner: "test-org",
    repo: "filter",
    pullNumber: 1,
    pr: {
      title: overrides.title ?? "Add feature",
      body: overrides.body ?? "Regular PR description.",
      user: { login: "contributor" },
      head: { sha: "abc", ref: "feature" },
      base: { ref: "main" },
    },
    octokit: {
      rest: {
        pulls: {
          listCommits: async () => ({
            data: (overrides.commits ?? []).map((message) => ({
              commit: { message },
            })),
          }),
        },
      },
    } as unknown as AnalyzerContext["octokit"],
    config: {
      ...DEFAULT_CONFIG,
      phrases: overrides.phrases ?? {},
    },
  };
}

describe("aiPatternsAnalyzer emoji patterns", () => {
  test("flags configured spam emojis in the PR body", async () => {
    const result = await aiPatternsAnalyzer(
      makeCtx({
        body: "Ship it ✨🚀 with love",
      }),
    );

    expect(result.reasons).toContain(
      "Spam/AI emoji patterns detected: ✨ 🚀",
    );
  });

  test("flags high emoji density", async () => {
    const result = await aiPatternsAnalyzer(
      makeCtx({
        body: "Great work ✨🚀💯🎉",
      }),
    );

    expect(result.reasons.some((reason) => reason.includes("emoji density"))).toBe(
      true,
    );
  });

  test("skips emoji checks when disabled in config", async () => {
    const result = await aiPatternsAnalyzer(
      makeCtx({
        body: "Ship it ✨🚀💯🎉",
        phrases: {
          emoji_patterns: { enabled: false },
        },
      }),
    );

    expect(result.reasons.some((reason) => reason.includes("emoji"))).toBe(
      false,
    );
  });

  test("uses maintainer-added spam emojis", async () => {
    const result = await aiPatternsAnalyzer(
      makeCtx({
        body: "Automated fix 🤖🤖",
        phrases: {
          emoji_patterns: {
            min_list_matches: 1,
            spam_emojis: {
              use_defaults: false,
              phrases: ["🤖"],
            },
          },
        },
      }),
    );

    expect(result.reasons).toContain(
      "Spam/AI emoji patterns detected: 🤖",
    );
  });
});
