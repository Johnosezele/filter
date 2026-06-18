import { Probot, type Context } from "probot";

import { handleIssueComment } from "./commands/handler.js";
import { runPipeline } from "./pipeline.js";

type PullRequestContext =
  | Context<"pull_request.opened">
  | Context<"pull_request.synchronize">
  | Context<"pull_request.reopened">;

async function handlePullRequest(context: PullRequestContext): Promise<void> {
  const { pull_request: pr, repository } = context.payload;
  const owner = repository.owner.login;
  const repo = repository.name;
  const pullNumber = pr.number;
  const sha = pr.head.sha;
  const action = context.payload.action;

  context.log.info(
    `PR #${pullNumber} ${action} — running spam check`,
  );

  try {
    await runPipeline({
      octokit: context.octokit,
      owner,
      repo,
      pullNumber,
      sha,
      defaultBranch: repository.default_branch,
      pr: {
        title: pr.title,
        body: pr.body,
        user: { login: pr.user?.login ?? "ghost" },
        head: { sha: pr.head.sha, ref: pr.head.ref },
        base: { ref: pr.base.ref },
      },
    });

    context.log.info(`PR #${pullNumber} spam check complete`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status: number }).status
        : undefined;
    context.log.error(
      { err: error, status },
      `PR #${pullNumber} spam check failed: ${message}`,
    );
    throw error;
  }
}

export default (app: Probot) => {
  app.on("pull_request.opened", handlePullRequest);
  app.on("pull_request.synchronize", handlePullRequest);
  app.on("pull_request.reopened", handlePullRequest);
  app.on("issue_comment.created", handleIssueComment);
};
