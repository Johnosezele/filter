import type { ProbotOctokit } from "probot";

import { postPassedStatus, postPendingStatus } from "./report/status.js";

export interface PipelineContext {
  octokit: ProbotOctokit;
  owner: string;
  repo: string;
  pullNumber: number;
  sha: string;
}

/**
 * Phase 1: posts pending then a dummy passing score.
 * Real analyzers and scoring land in Phase 2.
 */
export async function runPipeline(ctx: PipelineContext): Promise<void> {
  const { octokit, owner, repo, sha } = ctx;

  await postPendingStatus(octokit, owner, repo, sha);

  // Placeholder score until analyzers are wired in Phase 2.
  const score = 0;
  await postPassedStatus(octokit, owner, repo, sha, score);
}
