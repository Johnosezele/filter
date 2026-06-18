import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nock from "nock";
import { Probot, ProbotOctokit } from "probot";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import myProbotApp from "../src/index.js";
import { pullRequestOpenedEvent } from "./helpers/events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

describe("pull_request handler", () => {
  let probot: Probot;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    probot.load(myProbotApp);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("posts pending then success status on pull_request.opened", async () => {
    const statuses: Array<{ state: string; description: string }> = [];

    const mock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          statuses: "write",
          pull_requests: "write",
        },
      })
      .post("/repos/test-org/filter/statuses/abc123def456", (body) => {
        statuses.push({
          state: body.state as string,
          description: body.description as string,
        });
        expect(body.context).toBe("pr-spam-checker/status");
        return true;
      })
      .times(2)
      .reply(200);

    await probot.receive(pullRequestOpenedEvent());

    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toEqual({
      state: "pending",
      description: "PR Spam Check: analyzing...",
    });
    expect(statuses[1]).toEqual({
      state: "success",
      description: "PR Spam Check: passed (0%)",
    });
    expect(mock.pendingMocks()).toStrictEqual([]);
  });
});
