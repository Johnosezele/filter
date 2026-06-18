import type { Context } from "probot";

import { runPipeline } from "../pipeline.js";
import { postOverrideStatus } from "../report/status.js";
import { hasMaintainerWriteAccess } from "./auth.js";
import { parseSpamCommand } from "./parse.js";

type IssueCommentContext = Context<"issue_comment.created">;

export async function handleIssueComment(
  context: IssueCommentContext,
): Promise<void> {
  const { comment, issue, repository } = context.payload;

  if (!issue.pull_request) return;

  const command = parseSpamCommand(comment.body);
  if (!command) return;

  const login = comment.user?.login;
  if (!login) return;

  const owner = repository.owner.login;
  const repo = repository.name;
  const pullNumber = issue.number;

  const authorized = await hasMaintainerWriteAccess(
    context.octokit,
    owner,
    repo,
    login,
  );

  if (!authorized) {
    await context.octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: `@${login} Only users with write access can run \`/${command === "override" ? "spam-override" : "spam-recheck"}\`.`,
    });
    return;
  }

  const { data: pr } = await context.octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  if (command === "override") {
    await postOverrideStatus(
      context.octokit,
      owner,
      repo,
      pr.head.sha,
      login,
    );
    await context.octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: `Override applied by @${login}. Merge gate unlocked. New commits will re-run analysis.`,
    });
    context.log.info(`PR #${pullNumber} override by @${login}`);
    return;
  }

  context.log.info(`PR #${pullNumber} recheck requested by @${login}`);

  await runPipeline({
    octokit: context.octokit,
    owner,
    repo,
    pullNumber,
    sha: pr.head.sha,
    defaultBranch: repository.default_branch,
    pr: {
      title: pr.title,
      body: pr.body,
      user: { login: pr.user?.login ?? "ghost" },
      head: { sha: pr.head.sha, ref: pr.head.ref },
      base: { ref: pr.base.ref },
    },
  });
}
