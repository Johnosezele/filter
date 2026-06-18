import type { Analyzer } from "../types.js";
import { clamp01 } from "../utils/text.js";

const MS_PER_DAY = 86_400_000;

export const reputationAnalyzer: Analyzer = async (ctx) => {
  const reasons: string[] = [];
  let score = 0;
  const login = ctx.pr.user.login;

  const { data: user } = await ctx.octokit.rest.users.getByUsername({
    username: login,
  });

  const createdAt = new Date(user.created_at);
  const ageDays = (Date.now() - createdAt.getTime()) / MS_PER_DAY;

  if (ageDays < 7) {
    score += 0.4;
    reasons.push("GitHub account created within the last 7 days");
  } else if (ageDays < 30) {
    score += 0.2;
    reasons.push("GitHub account is less than 30 days old");
  }

  if ((user.public_repos ?? 0) === 0) {
    score += 0.15;
    reasons.push("Account has no public repositories");
  }

  if (!user.bio) {
    score += 0.1;
    reasons.push("Account has no profile bio");
  }

  try {
    const { data: events } = await ctx.octokit.rest.activity.listPublicEventsForUser(
      {
        username: login,
        per_page: 30,
      },
    );
    const yearAgo = Date.now() - 365 * MS_PER_DAY;
    const recentPush = events.some((event) => {
      const date = new Date(event.created_at ?? 0).getTime();
      return date >= yearAgo && event.type === "PushEvent";
    });
    if (events.length > 0 && !recentPush) {
      score += 0.15;
      reasons.push("No recent public push activity in the last year");
    }
  } catch {
    // Public events may be unavailable; skip this signal.
  }

  let contributedToRepo = false;
  try {
    const contributors = await ctx.octokit.paginate(
      ctx.octokit.rest.repos.listContributors,
      { owner: ctx.owner, repo: ctx.repo, per_page: 100 },
    );
    contributedToRepo = contributors.some(
      (c) => c.login?.toLowerCase() === login.toLowerCase(),
    );
  } catch {
    // Empty repo or permission edge case.
  }

  if (!contributedToRepo) {
    score += 0.2;
    reasons.push("No prior contributions to this repository");
  }

  try {
    const { data: search } =
      await ctx.octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:merged author:${login} repo:${ctx.owner}/${ctx.repo}`,
        per_page: 1,
      });
    if (search.total_count > 0) {
      score -= 0.3;
    }
  } catch {
    // Search may be unavailable; skip.
  }

  return {
    id: "reputation",
    score: clamp01(score),
    reasons,
    metadata: { accountAgeDays: Math.floor(ageDays) },
  };
};
