import type { EmitterWebhookEvent } from "@octokit/webhooks";

const basePayload = {
  action: "created" as const,
  issue: {
    number: 42,
    pull_request: {
      url: "https://api.github.com/repos/test-org/filter/pulls/42",
    },
  },
  repository: {
    name: "filter",
    default_branch: "main",
    owner: {
      login: "test-org",
    },
  },
  installation: {
    id: 2,
  },
};

export function issueCommentCreatedEvent(
  body: string,
  login = "maintainer",
): EmitterWebhookEvent<"issue_comment.created"> {
  return {
    id: "test-issue-comment-id",
    name: "issue_comment.created",
    payload: {
      ...basePayload,
      comment: {
        body,
        user: { login },
      },
    } as EmitterWebhookEvent<"issue_comment.created">["payload"],
  };
}
