import type { ProbotOctokit } from "probot";

export interface AnalyzerResult {
  id: string;
  score: number;
  reasons: string[];
  metadata?: Record<string, unknown>;
}

export interface RepoRules {
  require_issue_reference?: boolean;
  min_diff_lines?: number;
  required_sections?: string[];
  forbidden_phrases?: string[];
  forbidden_paths?: string[];
}

export interface PhraseListOverride {
  use_defaults?: boolean;
  phrases?: string[];
  add?: string[];
  remove?: string[];
}

export interface PhrasesConfig {
  generic_phrases?: PhraseListOverride;
  ai_phrases?: PhraseListOverride;
  transition_words?: PhraseListOverride;
  pleasantry_words?: PhraseListOverride;
}

export interface SpamCheckConfig {
  threshold: number;
  warnThreshold: number;
  alwaysComment: boolean;
  weights: {
    reputation: number;
    description: number;
    diff: number;
    ai_patterns: number;
    repo_rules: number;
  };
  rules: RepoRules;
  phrases: PhrasesConfig;
  allowlist: string[];
  disabledAnalyzers: string[];
}

export interface AnalyzerContext {
  owner: string;
  repo: string;
  pullNumber: number;
  pr: {
    title: string;
    body: string | null;
    user: { login: string };
    head: { sha: string; ref: string };
    base: { ref: string };
  };
  octokit: ProbotOctokit;
  config: SpamCheckConfig;
}

export type Analyzer = (ctx: AnalyzerContext) => Promise<AnalyzerResult>;

export type ScoreTier = "low" | "medium" | "high";

export interface ScoreSignal {
  id: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  reasons: string[];
}

export interface ScoreReport {
  overall: number;
  tier: ScoreTier;
  signals: ScoreSignal[];
}
