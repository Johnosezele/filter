import type { PhraseListOverride, PhrasesConfig } from "../types.js";

export const DEFAULT_GENERIC_PHRASES = [
  "fix bug",
  "improve code",
  "update file",
  "i have made the following changes",
  "this pull request introduces",
  "this pr addresses",
  "this pr aims to",
  "i would like to contribute",
  "hope this helps",
  "let me know if you have any questions",
  "please review and merge",
  "happy to make any changes",
  "feel free to reach out",
];

export const DEFAULT_AI_PHRASES = [
  "i have made the following changes",
  "this pull request introduces",
  "this pr addresses",
  "this pr aims to",
  "i would like to contribute",
  "hope this helps",
  "let me know if you have any questions",
  "please review and merge",
  "happy to make any changes",
  "feel free to reach out",
  "furthermore",
  "moreover",
  "additionally",
  "in addition",
  "good catch",
];

export const DEFAULT_TRANSITION_WORDS = [
  "furthermore",
  "moreover",
  "additionally",
  "in addition",
];

export const DEFAULT_PLEASANTRY_WORDS = [
  "let me know",
  "happy to",
  "please review",
];

/** Emojis common in low-effort / AI-generated PR descriptions. */
export const DEFAULT_SPAM_EMOJIS = [
  "✨",
  "🚀",
  "💯",
  "🎉",
  "🔥",
  "⚡",
  "🙏",
  "👍",
];

export interface ResolvedPhrases {
  genericPhrases: string[];
  aiPhrases: string[];
  transitionWords: RegExp;
  pleasantryPattern: RegExp;
}

export interface ResolvedEmojiPatterns {
  enabled: boolean;
  minCount: number;
  minListMatches: number;
  spamEmojis: string[];
}

function normalizeEmoji(emoji: string): string {
  return emoji.trim();
}

function resolveEmojiList(
  defaults: string[],
  override?: PhraseListOverride,
): string[] {
  if (override?.use_defaults === false) {
    return (override.phrases ?? []).map(normalizeEmoji).filter(Boolean);
  }

  const removed = new Set(
    (override?.remove ?? []).map(normalizeEmoji).filter(Boolean),
  );
  const base = defaults.filter((emoji) => !removed.has(emoji));
  const added = (override?.add ?? []).map(normalizeEmoji).filter(Boolean);

  return [...base, ...added.filter((emoji) => !base.includes(emoji))];
}

export function resolveEmojiPatterns(
  config?: PhrasesConfig["emoji_patterns"],
): ResolvedEmojiPatterns {
  return {
    enabled: config?.enabled ?? true,
    minCount: config?.min_count ?? 4,
    minListMatches: config?.min_list_matches ?? 2,
    spamEmojis: resolveEmojiList(DEFAULT_SPAM_EMOJIS, config?.spam_emojis),
  };
}

export function matchSpamEmojis(
  text: string,
  spamEmojis: string[],
): string[] {
  return spamEmojis.filter((emoji) => text.includes(emoji));
}

function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase();
}

function resolvePhraseList(
  defaults: string[],
  override?: PhraseListOverride,
): string[] {
  if (override?.use_defaults === false) {
    return (override.phrases ?? []).map(normalizePhrase).filter(Boolean);
  }

  const removed = new Set(
    (override?.remove ?? []).map(normalizePhrase).filter(Boolean),
  );
  const base = defaults.filter((phrase) => !removed.has(phrase));
  const added = (override?.add ?? []).map(normalizePhrase).filter(Boolean);

  return [...base, ...added.filter((phrase) => !base.includes(phrase))];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWordPattern(words: string[], flags: string): RegExp {
  if (words.length === 0) {
    return /(?!)/;
  }
  const pattern = words.map(escapeRegExp).join("|");
  return new RegExp(`\\b(${pattern})\\b`, flags);
}

export function resolvePhrases(config?: PhrasesConfig): ResolvedPhrases {
  const genericPhrases = resolvePhraseList(
    DEFAULT_GENERIC_PHRASES,
    config?.generic_phrases,
  );
  const aiPhrases = resolvePhraseList(DEFAULT_AI_PHRASES, config?.ai_phrases);
  const transitionWordList = resolvePhraseList(
    DEFAULT_TRANSITION_WORDS,
    config?.transition_words,
  );
  const pleasantryWordList = resolvePhraseList(
    DEFAULT_PLEASANTRY_WORDS,
    config?.pleasantry_words,
  );

  return {
    genericPhrases,
    aiPhrases,
    transitionWords: buildWordPattern(transitionWordList, "gi"),
    pleasantryPattern: buildWordPattern(pleasantryWordList, "i"),
  };
}
