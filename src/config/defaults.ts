import type { SpamCheckConfig } from "../types.js";

export const DEFAULT_CONFIG: SpamCheckConfig = {
  threshold: 70,
  warnThreshold: 30,
  alwaysComment: false,
  weights: {
    reputation: 0.25,
    description: 0.3,
    diff: 0.3,
    ai_patterns: 0.15,
    repo_rules: 0,
  },
  rules: {},
  phrases: {},
  allowlist: ["dependabot[bot]", "renovate[bot]"],
  disabledAnalyzers: [],
};
