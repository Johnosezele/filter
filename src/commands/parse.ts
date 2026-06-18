export type SpamCommand = "override" | "recheck";

export function parseSpamCommand(
  body: string | null | undefined,
): SpamCommand | null {
  const trimmed = (body ?? "").trim().toLowerCase();
  if (trimmed === "/spam-override") return "override";
  if (trimmed === "/spam-recheck") return "recheck";
  return null;
}
