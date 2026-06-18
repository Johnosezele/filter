/** Commit status context — branch protection must require this exact string. */
export const STATUS_CONTEXT = "pr-spam-checker/status";

export const PULL_REQUEST_ACTIONS = [
  "opened",
  "synchronize",
  "reopened",
] as const;
