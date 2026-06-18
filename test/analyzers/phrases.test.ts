import { describe, expect, test } from "vitest";

import {
  DEFAULT_GENERIC_PHRASES,
  resolveEmojiPatterns,
  resolvePhrases,
} from "../../src/analyzers/phrases.js";
import { descriptionAnalyzer } from "../../src/analyzers/description.js";
import { DEFAULT_CONFIG } from "../../src/config/defaults.js";
import type { AnalyzerContext } from "../../src/types.js";

describe("resolvePhrases", () => {
  test("returns built-in defaults when config is empty", () => {
    const resolved = resolvePhrases();

    expect(resolved.genericPhrases).toEqual(DEFAULT_GENERIC_PHRASES);
    expect(resolved.aiPhrases).toContain("furthermore");
    expect("furthermore".match(resolved.transitionWords)).not.toBeNull();
    expect(resolved.pleasantryPattern.test("please review")).toBe(true);
  });

  test("adds and removes phrases from defaults", () => {
    const resolved = resolvePhrases({
      generic_phrases: {
        add: ["Hacktoberfest"],
        remove: ["fix bug"],
      },
    });

    expect(resolved.genericPhrases).toContain("hacktoberfest");
    expect(resolved.genericPhrases).not.toContain("fix bug");
  });

  test("replaces defaults when use_defaults is false", () => {
    const resolved = resolvePhrases({
      generic_phrases: {
        use_defaults: false,
        phrases: ["custom spam phrase"],
      },
    });

    expect(resolved.genericPhrases).toEqual(["custom spam phrase"]);
    expect(resolved.genericPhrases).not.toContain("fix bug");
  });
});

describe("resolveEmojiPatterns", () => {
  test("returns built-in spam emojis by default", () => {
    const resolved = resolveEmojiPatterns();

    expect(resolved.enabled).toBe(true);
    expect(resolved.minCount).toBe(4);
    expect(resolved.minListMatches).toBe(2);
    expect(resolved.spamEmojis).toContain("✨");
    expect(resolved.spamEmojis).toContain("🚀");
  });

  test("adds and removes configured spam emojis", () => {
    const resolved = resolveEmojiPatterns({
      spam_emojis: {
        add: ["🤖"],
        remove: ["👍"],
      },
    });

    expect(resolved.spamEmojis).toContain("🤖");
    expect(resolved.spamEmojis).not.toContain("👍");
  });

  test("can disable emoji checks", () => {
    const resolved = resolveEmojiPatterns({ enabled: false });
    expect(resolved.enabled).toBe(false);
  });
});

describe("descriptionAnalyzer phrase customization", () => {
  function makeCtx(body: string, phrases: AnalyzerContext["config"]["phrases"]) {
    return {
      owner: "test-org",
      repo: "filter",
      pullNumber: 1,
      pr: {
        title: "Add feature",
        body,
        user: { login: "contributor" },
        head: { sha: "abc", ref: "feature" },
        base: { ref: "main" },
      },
      octokit: {} as AnalyzerContext["octokit"],
      config: {
        ...DEFAULT_CONFIG,
        phrases,
      },
    };
  }

  test("flags maintainer-added phrases", async () => {
    const result = await descriptionAnalyzer(
      makeCtx("This PR is part of hacktoberfest contributions.", {
        generic_phrases: { add: ["hacktoberfest"] },
      }),
    );

    expect(result.reasons).toContain(
      'Description matches generic phrase: "hacktoberfest"',
    );
  });

  test("ignores removed default phrases", async () => {
    const result = await descriptionAnalyzer(
      makeCtx("fix bug", {
        generic_phrases: { remove: ["fix bug"] },
      }),
    );

    expect(
      result.reasons.some((reason) => reason.includes("generic phrase")),
    ).toBe(false);
  });
});
