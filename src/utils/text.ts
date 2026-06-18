export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i]![0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0]![j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  const distance = matrix[a.length]![b.length]!;
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

export function sentenceLengthStdDev(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length < 2) return 0;

  const lengths = sentences.map((s) => countWords(s));
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + (len - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance);
}

export function hasIssueReference(text: string): boolean {
  return /(?:fixes|closes|resolves)\s+#\d+/i.test(text) || /#\d+/.test(text);
}

const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

export function countEmojis(text: string): number {
  return text.match(EMOJI_PATTERN)?.length ?? 0;
}
