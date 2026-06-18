import { describe, expect, test } from "vitest";

import { matchGlob } from "../../src/utils/glob.js";

describe("matchGlob", () => {
  test("matches single-segment and recursive globs", () => {
    expect(matchGlob("docs/*.md", "docs/readme.md")).toBe(true);
    expect(matchGlob("docs/*.md", "docs/sponsors/readme.md")).toBe(false);
    expect(matchGlob("docs/**", "docs/sponsors/readme.md")).toBe(true);
  });
});
