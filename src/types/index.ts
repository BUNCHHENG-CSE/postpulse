export type GitEventType = 'commit' | 'release' | 'pull_request';

export type CommitCategory =
  | 'architecture'
  | 'performance'
  | 'bug_war_story'
  | 'ui_ux'
  | 'new_feature'
  | 'security_auth'
  | 'database_migration'
  | 'chore_internal';

export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  additions: number;
  deletions: number;
  patchSnippet?: string;
}

export interface PostWorthiness {
  score: number; // 0 - 100
  category: CommitCategory;
  reasons: string[];
  isWorthPosting: boolean;
  recommendedHook?: string;
}

export interface GitEvent {
  id: string;
  type: GitEventType;
  repo: string;
  branch: string;
  author: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  timestamp: string;
  title: string;
  description?: string;
  sha: string;
  shortSha: string;
  url: string;
  stats: {
    additions: number;
    deletions: number;
    totalFiles: number;
  };
  files: FileChange[];
  rawDiffSnippet?: string;
  worthiness: PostWorthiness;
  status: 'pending' | 'drafted' | 'published' | 'dismissed';
}

export type DraftFormat = 'technical_lesson' | 'build_in_public' | 'changelog';

export type ToneStyle =
  | 'authentic_raw'
  | 'war_story'
  | 'hard_lesson'
  | 'spicy_take'
  | 'founder_honest'
  | 'crisp_minimal';

export interface ContentDraft {
  id: string;
  eventId: string;
  format: DraftFormat;
  targetPlatform: 'reddit' | 'indie_hackers' | 'linkedin' | 'x_twitter' | 'changelog' | 'dev_to';
  platformName: string;
  title: string;
  hook: string;
  content: string; // Markdown
  tone: ToneStyle;
  wordCount: number;
  publishChecklist: string[];
  estimatedReadTime: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  publishedUrl?: string;
}

export interface EngineSettings {
  productName: string;
  productTagline: string;
  targetAudience: string;
  founderVoiceBio: string;
  repoUrl: string;
  githubWebhookSecret: string;
  githubToken?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  preferredModel: string;
  minScoreToDraft: number;
  autoDraftOnWebhook: boolean;
}

export interface DraftsByEvent {
  event: GitEvent;
  technicalLesson?: ContentDraft;
  buildInPublic?: ContentDraft;
  changelog?: ContentDraft;
}

export interface ValidationMetric {
  totalEvaluated: number;
  publishableCount: number;
  publishablePercentage: number;
  thresholdPassed: boolean; // >= 4 out of 10 (40%)
  breakdown: {
    readyAsIs: number;
    lightEditsNeeded: number;
    heavyEditsNeeded: number;
    unpublishable: number;
  };
}
