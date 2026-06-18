import { z } from "zod";

import { DEFAULT_CONFIG } from "./defaults.js";

const weightsSchema = z
  .object({
    reputation: z.number().min(0).max(1).optional(),
    description: z.number().min(0).max(1).optional(),
    diff: z.number().min(0).max(1).optional(),
    ai_patterns: z.number().min(0).max(1).optional(),
    repo_rules: z.number().min(0).max(1).optional(),
  })
  .optional();

const rulesSchema = z
  .object({
    require_issue_reference: z.boolean().optional(),
    min_diff_lines: z.number().int().positive().optional(),
    required_sections: z.array(z.string()).optional(),
    forbidden_phrases: z.array(z.string()).optional(),
    forbidden_paths: z.array(z.string()).optional(),
  })
  .optional();

const phraseListSchema = z
  .object({
    use_defaults: z.boolean().optional(),
    phrases: z.array(z.string()).optional(),
    add: z.array(z.string()).optional(),
    remove: z.array(z.string()).optional(),
  })
  .optional();

const phrasesSchema = z
  .object({
    generic_phrases: phraseListSchema,
    ai_phrases: phraseListSchema,
    transition_words: phraseListSchema,
    pleasantry_words: phraseListSchema,
    emoji_patterns: z
      .object({
        enabled: z.boolean().optional(),
        min_count: z.number().int().positive().optional(),
        min_list_matches: z.number().int().positive().optional(),
        spam_emojis: phraseListSchema,
      })
      .optional(),
  })
  .optional();

export const spamCheckConfigSchema = z.object({
  threshold: z.number().min(0).max(100).optional(),
  warn_threshold: z.number().min(0).max(100).optional(),
  always_comment: z.boolean().optional(),
  weights: weightsSchema,
  rules: rulesSchema,
  phrases: phrasesSchema,
  allowlist: z.array(z.string()).optional(),
  disabled_analyzers: z.array(z.string()).optional(),
});

export type SpamCheckConfigInput = z.infer<typeof spamCheckConfigSchema>;

export function parseSpamCheckConfig(raw: unknown) {
  const parsed = spamCheckConfigSchema.parse(raw);
  return {
    threshold: parsed.threshold ?? DEFAULT_CONFIG.threshold,
    warnThreshold: parsed.warn_threshold ?? DEFAULT_CONFIG.warnThreshold,
    alwaysComment: parsed.always_comment ?? DEFAULT_CONFIG.alwaysComment,
    weights: {
      ...DEFAULT_CONFIG.weights,
      ...parsed.weights,
    },
    rules: parsed.rules ?? DEFAULT_CONFIG.rules,
    phrases: {
      ...DEFAULT_CONFIG.phrases,
      ...parsed.phrases,
    },
    allowlist: parsed.allowlist ?? DEFAULT_CONFIG.allowlist,
    disabledAnalyzers:
      parsed.disabled_analyzers ?? DEFAULT_CONFIG.disabledAnalyzers,
  };
}
