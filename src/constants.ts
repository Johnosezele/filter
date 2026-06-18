/** Commit status context — branch protection must require this exact string. */
export const STATUS_CONTEXT = "pr-spam-checker/status";

/** Hidden marker for upserting the PR spam check comment. */
export const COMMENT_MARKER = "<!-- pr-spam-checker -->";

export const PULL_REQUEST_ACTIONS = [
  "opened",
  "synchronize",
  "reopened",
] as const;
