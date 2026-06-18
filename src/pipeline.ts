import { runAnalyzers } from "./analyzers/index.js";
import { isAllowlisted, loadConfig } from "./config/loader.js";
import {
  buildComment,
  shouldComment,
  upsertSpamCheckComment,
} from "./report/comment.js";
import {
  postAllowlistedStatus,
  postErrorStatus,
  postPendingStatus,
  postReportStatus,
} from "./report/status.js";
import { score } from "./scorer.js";
import type { ProbotOctokit } from "probot";

export interface PipelineContext {
  octokit: ProbotOctokit;
  owner: string;
  repo: string;
  pullNumber: number;
  sha: string;
  defaultBranch: string;
  pr: {
    title: string;
    body: string | null;
    user: { login: string };
    head: { sha: string; ref: string };
    base: { ref: string };
  };
}

export async function runPipeline(ctx: PipelineContext): Promise<void> {
  const { octokit, owner, repo, pullNumber, sha, pr, defaultBranch } = ctx;

  await postPendingStatus(octokit, owner, repo, sha);

  try {
    const config = await loadConfig(octokit, owner, repo, defaultBranch);

    if (isAllowlisted(pr.user.login, config.allowlist)) {
      await postAllowlistedStatus(octokit, owner, repo, sha, pr.user.login);
      return;
    }

    const analyzerCtx = {
      owner,
      repo,
      pullNumber,
      pr,
      octokit,
      config,
    };

    const results = await runAnalyzers(analyzerCtx);
    const report = score(results, config);

    await postReportStatus(octokit, owner, repo, sha, report);

    if (shouldComment(report, config)) {
      await upsertSpamCheckComment(
        octokit,
        owner,
        repo,
        pullNumber,
        buildComment(report),
      );
    }
  } catch (error) {
    await postErrorStatus(octokit, owner, repo, sha);
    throw error;
  }
}
