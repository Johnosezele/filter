import type { ProbotOctokit } from "probot";
import yaml from "yaml";

import type { SpamCheckConfig } from "../types.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import { parseSpamCheckConfig } from "./schema.js";

export async function loadConfig(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  ref: string,
): Promise<SpamCheckConfig> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".spam-check.yml",
      ref,
    });

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      return DEFAULT_CONFIG;
    }

    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    const raw = yaml.parse(decoded);
    return parseSpamCheckConfig(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function isAllowlisted(
  login: string,
  allowlist: string[],
): boolean {
  const normalized = login.toLowerCase();
  return allowlist.some((entry) => entry.toLowerCase() === normalized);
}
