import type { EmitterWebhookEvent } from "@octokit/webhooks";

import fixture from "../fixtures/pull_request.opened.json" with { type: "json" };

/** Minimal pull_request.opened webhook for unit tests. */
export function pullRequestOpenedEvent(): EmitterWebhookEvent<"pull_request.opened"> {
  return {
    id: "test-webhook-id",
    name: "pull_request.opened",
    payload: fixture as EmitterWebhookEvent<"pull_request.opened">["payload"],
  };
}
