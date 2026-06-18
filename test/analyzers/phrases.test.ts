import { describe, expect, test } from "vitest";

import {
  DEFAULT_GENERIC_PHRASES,
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
