import type { ProbotOctokit } from "probot";

import { STATUS_CONTEXT } from "../constants.js";
import type { ScoreReport, ScoreTier } from "../types.js";

export type StatusState = "pending" | "success" | "failure" | "error";

export interface StatusParams {
  octokit: ProbotOctokit;
  owner: string;
  repo: string;
  sha: string;
  state: StatusState;
  description: string;
  targetUrl?: string;
}

function tierLabel(tier: ScoreTier): string {
  switch (tier) {
    case "high":
      return "blocked";
    case "medium":
      return "review recommended";
    default:
      return "passed";
  }
}

export function statusDescription(report: ScoreReport): string {
  return `PR Spam Check: ${tierLabel(report.tier)} (${report.overall}%)`;
}

export function statusState(report: ScoreReport): StatusState {
  return report.tier === "high" ? "failure" : "success";
}

export async function postStatus({
  octokit,
  owner,
  repo,
  sha,
  state,
  description,
  targetUrl,
}: StatusParams): Promise<void> {
  await octokit.rest.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state,
    context: STATUS_CONTEXT,
    description,
    target_url: targetUrl,
  });
}

export async function postPendingStatus(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  sha: string,
): Promise<void> {
  await postStatus({
    octokit,
    owner,
    repo,
    sha,
    state: "pending",
    description: "PR Spam Check: analyzing...",
  });
}

export async function postReportStatus(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  sha: string,
  report: ScoreReport,
): Promise<void> {
  await postStatus({
    octokit,
    owner,
    repo,
    sha,
    state: statusState(report),
    description: statusDescription(report),
  });
}

export async function postAllowlistedStatus(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  sha: string,
  login: string,
): Promise<void> {
  await postStatus({
    octokit,
    owner,
    repo,
    sha,
    state: "success",
    description: `PR Spam Check: allowlisted (@${login})`,
  });
}

export async function postErrorStatus(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  sha: string,
): Promise<void> {
  await postStatus({
    octokit,
    owner,
    repo,
    sha,
    state: "error",
    description: "PR Spam Check: analysis failed",
  });
}
