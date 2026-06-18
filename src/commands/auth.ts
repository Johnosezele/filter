import type { ProbotOctokit } from "probot";

const WRITE_PERMISSIONS = new Set(["admin", "write"]);

export async function hasMaintainerWriteAccess(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  username: string,
): Promise<boolean> {
  if (owner.toLowerCase() === username.toLowerCase()) {
    return true;
  }

  try {
    const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username,
    });
    return WRITE_PERMISSIONS.has(data.permission);
  } catch {
    return false;
  }
}
