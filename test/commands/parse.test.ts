import { describe, expect, test } from "vitest";

import { parseSpamCommand } from "../../src/commands/parse.js";

describe("parseSpamCommand", () => {
  test("recognizes override and recheck commands", () => {
    expect(parseSpamCommand("/spam-override")).toBe("override");
    expect(parseSpamCommand("/spam-recheck")).toBe("recheck");
    expect(parseSpamCommand("  /SPAM-OVERRIDE  ")).toBe("override");
  });

  test("ignores non-command comments", () => {
    expect(parseSpamCommand("please /spam-override")).toBeNull();
    expect(parseSpamCommand("/spam-override please")).toBeNull();
    expect(parseSpamCommand("looks good")).toBeNull();
  });
});
