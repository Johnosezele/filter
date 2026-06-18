import type { ProbotOctokit } from "probot";

import { STATUS_CONTEXT } from "../constants.js";

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

export async function postPassedStatus(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  sha: string,
  score: number,
): Promise<void> {
  await postStatus({
    octokit,
    owner,
    repo,
    sha,
    state: "success",
    description: `PR Spam Check: passed (${score}%)`,
  });
}
