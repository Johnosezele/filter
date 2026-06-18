import { Probot, type Context } from "probot";

import { runPipeline } from "./pipeline.js";

type PullRequestContext =
  | Context<"pull_request.opened">
  | Context<"pull_request.synchronize">
  | Context<"pull_request.reopened">;

async function handlePullRequest(context: PullRequestContext): Promise<void> {
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const pullNumber = context.payload.pull_request.number;
  const sha = context.payload.pull_request.head.sha;
  const action = context.payload.action;

  context.log.info(
    `PR #${pullNumber} ${action} — running spam check (phase 1)`,
  );

  await runPipeline({
    octokit: context.octokit,
    owner,
    repo,
    pullNumber,
    sha,
  });
}

export default (app: Probot) => {
  app.on("pull_request.opened", handlePullRequest);
  app.on("pull_request.synchronize", handlePullRequest);
  app.on("pull_request.reopened", handlePullRequest);
};
