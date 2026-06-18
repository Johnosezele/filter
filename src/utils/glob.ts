/** Minimal glob match for repo rule paths (`*` and `**` only). */
export function matchGlob(pattern: string, filePath: string): boolean {
  const GLOBSTAR = "\0";
  const regexSource = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, GLOBSTAR)
    .replace(/\*/g, "[^/]*")
    .replaceAll(GLOBSTAR, ".*");

  return new RegExp(`^${regexSource}$`).test(filePath);
}
