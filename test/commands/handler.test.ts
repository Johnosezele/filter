import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nock from "nock";
import { Probot, ProbotOctokit } from "probot";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import myProbotApp from "../../src/index.js";
import { issueCommentCreatedEvent } from "../helpers/issue-comment-events.js";
import { mockGithubAnalysisApis } from "../helpers/github-mocks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "../fixtures/mock-cert.pem"),
  "utf-8",
);

const pullResponse = {
  number: 42,
  title: "Add feature",
  body: "Fixes #1",
  user: { login: "new-contributor" },
  head: { sha: "abc123def456", ref: "feature-branch" },
  base: { ref: "main" },
};

function mockInstallationToken(mock: nock.Scope): void {
  mock.post("/app/installations/2/access_tokens").reply(200, {
    token: "test",
    permissions: {
      statuses: "write",
      pull_requests: "read",
      contents: "read",
      issues: "write",
      administration: "read",
    },
  });
}

describe("issue_comment commands", () => {
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

  test("/spam-override posts success override status for maintainers", async () => {
    const statuses: Array<{ state: string; description: string }> = [];
    const mock = nock("https://api.github.com");

    mockInstallationToken(mock);
    mock
      .get("/repos/test-org/filter/collaborators/maintainer/permission")
      .reply(200, { permission: "admin" })
      .get("/repos/test-org/filter/pulls/42")
      .reply(200, pullResponse)
      .post("/repos/test-org/filter/statuses/abc123def456", (body) => {
        statuses.push({
          state: body.state as string,
          description: body.description as string,
        });
        return true;
      })
      .reply(200)
      .post("/repos/test-org/filter/issues/42/comments", (body) => {
        expect(body.body).toContain("Override applied by @maintainer");
        return true;
      })
      .reply(200);

    await probot.receive(issueCommentCreatedEvent("/spam-override"));

    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toEqual({
      state: "success",
      description: "PR Spam Check: override by @maintainer",
    });
    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("/spam-recheck reruns the analysis pipeline", async () => {
    const statuses: Array<{ state: string; description: string }> = [];
    const mock = nock("https://api.github.com");

    mockInstallationToken(mock);
    mock
      .get("/repos/test-org/filter/collaborators/maintainer/permission")
      .reply(200, { permission: "write" })
      .get("/repos/test-org/filter/pulls/42")
      .reply(200, pullResponse);

    mockGithubAnalysisApis();
    mock
      .post("/repos/test-org/filter/statuses/abc123def456", (body) => {
        statuses.push({
          state: body.state as string,
          description: body.description as string,
        });
        return true;
      })
      .times(2)
      .reply(200);

    await probot.receive(issueCommentCreatedEvent("/spam-recheck"));

    expect(statuses).toHaveLength(2);
    expect(statuses[0]?.description).toBe("PR Spam Check: analyzing...");
    expect(statuses[1]?.description).toMatch(/PR Spam Check:/);
    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("rejects commands from users without write access", async () => {
    const mock = nock("https://api.github.com");

    mockInstallationToken(mock);
    mock
      .get("/repos/test-org/filter/collaborators/stranger/permission")
      .reply(200, { permission: "read" })
      .post("/repos/test-org/filter/issues/42/comments", (body) => {
        expect(body.body).toContain("Only users with write access");
        return true;
      })
      .reply(200);

    await probot.receive(
      issueCommentCreatedEvent("/spam-override", "stranger"),
    );

    expect(mock.pendingMocks()).toStrictEqual([]);
  });
});
