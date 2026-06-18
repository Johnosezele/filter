import nock from "nock";

export function mockGithubAnalysisApis(
  owner = "test-org",
  repo = "filter",
  pullNumber = 42,
): nock.Scope {
  const oldDate = "2019-06-01T00:00:00Z";

  return nock("https://api.github.com")
    .get(`/repos/${owner}/${repo}/contents/.spam-check.yml`)
    .query(true)
    .reply(404, { message: "Not Found" })
    .get("/users/new-contributor")
    .reply(200, {
      login: "new-contributor",
      created_at: oldDate,
      public_repos: 12,
      bio: "Open-source contributor",
    })
    .get("/users/new-contributor/events/public")
    .query(true)
    .reply(200, [
      {
        type: "PushEvent",
        created_at: new Date().toISOString(),
      },
    ])
    .get(`/repos/${owner}/${repo}/contributors`)
    .query(true)
    .reply(200, [{ login: "new-contributor", contributions: 3 }])
    .get("/search/issues")
    .query(true)
    .reply(200, { total_count: 1, items: [{ number: 1 }] })
    .get(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`)
    .query(true)
    .reply(200, [
      {
        filename: "src/index.ts",
        patch: "@@ -0,0 +1,3 @@\n+export const x = 1;\n+\n+",
        additions: 3,
        deletions: 0,
      },
      {
        filename: "test/index.test.ts",
        patch: "@@ -0,0 +1,2 @@\n+test('x', () => {});\n+",
        additions: 2,
        deletions: 0,
      },
    ])
    .get(`/repos/${owner}/${repo}/pulls/${pullNumber}/commits`)
    .query(true)
    .reply(200, [
      {
        commit: {
          message: "Add structured logging for spam check pipeline",
        },
      },
    ]);
}
