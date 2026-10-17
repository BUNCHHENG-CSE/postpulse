import fs from 'fs/promises';
import path from 'path';
import { ContentDraft, EngineSettings, FileChange, GitEvent } from '@/types';
import { classifyGitEvent } from './classifier';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const DRAFTS_FILE = path.join(DATA_DIR, 'drafts.json');

const DEFAULT_SETTINGS: EngineSettings = {
  productName: 'PostPulse',
  productTagline: 'Turn your git commits into viral developer content automatically',
  targetAudience: 'Indie hackers, micro-SaaS founders, and full-stack software engineers',
  founderVoiceBio: 'Solo developer, ex-infrastructure engineer, no-nonsense technical tone with zero marketing hype',
  repoUrl: 'https://github.com/developer/postpulse',
  githubWebhookSecret: 'dev_secret_content_engine_123',
  githubToken: '',
  preferredModel: 'gpt-4o-mini',
  minScoreToDraft: 50,
  autoDraftOnWebhook: true,
};

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

export async function getSettings(): Promise<EngineSettings> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<EngineSettings>): Promise<EngineSettings> {
  await ensureDataDir();
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export async function getEvents(): Promise<GitEvent[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const seeded = getSeededEvents();
    await fs.writeFile(EVENTS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

export async function getEventById(id: string): Promise<GitEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) || null;
}

export async function saveEvent(event: GitEvent): Promise<GitEvent> {
  await ensureDataDir();
  const events = await getEvents();
  const existingIdx = events.findIndex((e) => e.id === event.id || e.sha === event.sha);

  if (existingIdx >= 0) {
    events[existingIdx] = event;
  } else {
    events.unshift(event);
  }

  await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  return event;
}

export async function updateEventStatus(id: string, status: GitEvent['status']): Promise<void> {
  const events = await getEvents();
  const target = events.find((e) => e.id === id);
  if (target) {
    target.status = status;
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await getEvents();
  const filtered = events.filter((e) => e.id !== id);
  await fs.writeFile(EVENTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
}

export async function getDrafts(): Promise<ContentDraft[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(DRAFTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getDraftsByEventId(eventId: string): Promise<ContentDraft[]> {
  const drafts = await getDrafts();
  return drafts.filter((d) => d.eventId === eventId);
}

export async function saveDraft(draft: ContentDraft): Promise<ContentDraft> {
  await ensureDataDir();
  const drafts = await getDrafts();
  const existingIdx = drafts.findIndex((d) => d.id === draft.id);

  if (existingIdx >= 0) {
    drafts[existingIdx] = draft;
  } else {
    drafts.unshift(draft);
  }

  await fs.writeFile(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
  return draft;
}

export async function updateDraft(id: string, updates: Partial<ContentDraft>): Promise<ContentDraft | null> {
  const drafts = await getDrafts();
  const target = drafts.find((d) => d.id === id);
  if (!target) return null;

  Object.assign(target, updates, { updatedAt: new Date().toISOString(), isEdited: true });
  await fs.writeFile(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
  return target;
}

export async function resetToDefaultDataset(): Promise<GitEvent[]> {
  const seeded = getSeededEvents();
  await ensureDataDir();
  await fs.writeFile(EVENTS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
  await fs.writeFile(DRAFTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  return seeded;
}

/**
 * 10 realistic, diverse developer commits representing real-world indie hacker scenarios
 * Used directly for the 10-commit quality validation benchmark!
 */
export function getSeededEvents(): GitEvent[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const rawSeedData: Array<{
    id: string;
    title: string;
    description: string;
    files: FileChange[];
    additions: number;
    deletions: number;
    sha: string;
    dateOffset: number;
  }> = [
    {
      id: 'evt_commit_01',
      title: 'perf(db): add composite partial index on events(org_id, created_at) to stop sequential table scans',
      description: 'Fixes slow dashboard loading where queries on pending events took ~3.2s when row count crossed 250k. Added CONCURRENT index.',
      files: [
        { filename: 'prisma/migrations/20261014_add_event_idx.sql', status: 'added' as const, additions: 24, deletions: 0, patchSnippet: 'CREATE INDEX CONCURRENTLY idx_events_pending_org ON events (org_id, created_at DESC) WHERE status = "pending";' },
        { filename: 'src/server/queries/events.ts', status: 'modified' as const, additions: 12, deletions: 4 }
      ],
      additions: 36,
      deletions: 4,
      sha: 'a89c201',
      dateOffset: 0.2 * day
    },
    {
      id: 'evt_commit_02',
      title: 'fix(billing): handle stripe webhook race condition with atomic redis idempotency lock',
      description: 'Fixed edge case where customer invoice.payment_succeeded and checkout.session.completed hit webhook endpoint within 40ms, provisioning double quota.',
      files: [
        { filename: 'src/app/api/webhooks/stripe/route.ts', status: 'modified' as const, additions: 48, deletions: 14, patchSnippet: 'const lock = await redis.set(`lock:stripe:${eventId}`, "1", "NX", "EX", 30);\nif (!lock) return res.status(200).send("Already processing");' },
        { filename: 'src/lib/redis.ts', status: 'modified' as const, additions: 18, deletions: 2 }
      ],
      additions: 66,
      deletions: 16,
      sha: 'c74f912',
      dateOffset: 0.8 * day
    },
    {
      id: 'evt_commit_03',
      title: 'ui(editor): replace 3-step setup modal with split-view live preview and keyboard shortcuts',
      description: 'Removed the wizard modal because analytics showed 28% drop-off at step 2. Added immediate split-view live editor with Cmd+Enter publish.',
      files: [
        { filename: 'src/components/studio/SplitEditor.tsx', status: 'added' as const, additions: 180, deletions: 0 },
        { filename: 'src/components/modals/WizardModal.tsx', status: 'removed' as const, additions: 0, deletions: 210 },
        { filename: 'src/hooks/useKeyboardShortcuts.ts', status: 'added' as const, additions: 42, deletions: 0 }
      ],
      additions: 222,
      deletions: 210,
      sha: 'e12d480',
      dateOffset: 1.5 * day
    },
    {
      id: 'evt_commit_04',
      title: 'perf(export): stream CSV downloads directly instead of buffering 50MB strings in memory',
      description: 'Node process was running out of heap memory (OOM crash) when users with >20k rows clicked Export. Rewrote to use TransformStream.',
      files: [
        { filename: 'src/app/api/export/csv/route.ts', status: 'modified' as const, additions: 64, deletions: 38, patchSnippet: 'const stream = new TransformStream();\nconst writer = stream.writable.getWriter();\n// pipe chunks directly to response' }
      ],
      additions: 64,
      deletions: 38,
      sha: 'f55b119',
      dateOffset: 2.1 * day
    },
    {
      id: 'evt_commit_05',
      title: 'fix(auth): prevent flash of unauthenticated state during JWT token rotation',
      description: 'Resolved issue where refreshing page on slow network flashed login screen for 300ms before session rehydrated. Added optimistic local cache.',
      files: [
        { filename: 'src/context/AuthContext.tsx', status: 'modified' as const, additions: 35, deletions: 19 },
        { filename: 'src/lib/tokenManager.ts', status: 'modified' as const, additions: 52, deletions: 8 }
      ],
      additions: 87,
      deletions: 27,
      sha: 'b33a772',
      dateOffset: 2.9 * day
    },
    {
      id: 'evt_commit_06',
      title: 'feat(notifications): add multi-channel webhook dispatcher with exponential backoff retry',
      description: 'Users can now configure custom webhooks for Slack, Discord, and Telegram. Includes dead-letter queue and automatic 5-attempt retry.',
      files: [
        { filename: 'src/services/webhookDispatcher.ts', status: 'added' as const, additions: 145, deletions: 0 },
        { filename: 'src/queue/retryWorker.ts', status: 'added' as const, additions: 92, deletions: 0 }
      ],
      additions: 237,
      deletions: 0,
      sha: '990f234',
      dateOffset: 3.8 * day
    },
    {
      id: 'evt_commit_07',
      title: 'perf(cache): implement stale-while-revalidate for public metadata endpoints',
      description: 'Cached repo badges and public metadata at edge using Cloudflare headers. Reduced origin server requests by 82%.',
      files: [
        { filename: 'src/app/api/badges/[id]/route.ts', status: 'modified' as const, additions: 22, deletions: 11, patchSnippet: 'headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");' }
      ],
      additions: 22,
      deletions: 11,
      sha: '711cc38',
      dateOffset: 4.5 * day
    },
    {
      id: 'evt_commit_08',
      title: 'refactor(core): decouple git parser from vendor APIs to support GitLab and Gitea',
      description: 'Extracted unified GitEvent interface. Makes adding new git providers take 1 file instead of modifying 6 handlers.',
      files: [
        { filename: 'src/core/git/GitProviderInterface.ts', status: 'added' as const, additions: 78, deletions: 0 },
        { filename: 'src/core/git/GitHubAdapter.ts', status: 'modified' as const, additions: 45, deletions: 90 },
        { filename: 'src/core/git/GitLabAdapter.ts', status: 'added' as const, additions: 62, deletions: 0 }
      ],
      additions: 185,
      deletions: 90,
      sha: '44a9812',
      dateOffset: 5.2 * day
    },
    {
      id: 'evt_commit_09',
      title: 'chore(deps): bump tailwindcss from 3.4.1 to 3.4.17 and update package-lock',
      description: 'Routine maintenance dependency bump.',
      files: [
        { filename: 'package.json', status: 'modified' as const, additions: 1, deletions: 1 },
        { filename: 'package-lock.json', status: 'modified' as const, additions: 142, deletions: 139 }
      ],
      additions: 143,
      deletions: 140,
      sha: '22e8910',
      dateOffset: 6.0 * day
    },
    {
      id: 'evt_commit_10',
      title: 'docs: fix broken link in CONTRIBUTING.md and typo in install guide',
      description: 'Updated outdated markdown link to docker setup.',
      files: [
        { filename: 'CONTRIBUTING.md', status: 'modified' as const, additions: 2, deletions: 2 }
      ],
      additions: 2,
      deletions: 2,
      sha: '109ca88',
      dateOffset: 6.8 * day
    }
  ];

  return rawSeedData.map((raw) => {
    const stats = {
      additions: raw.additions,
      deletions: raw.deletions,
      totalFiles: raw.files.length,
    };

    const worthiness = classifyGitEvent({
      title: raw.title,
      description: raw.description,
      files: raw.files,
      stats,
    });

    return {
      id: raw.id,
      type: 'commit',
      repo: 'alexrivera/postpulse-app',
      branch: 'main',
      author: {
        name: 'Alex Rivera',
        username: 'alexrivera',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      },
      timestamp: new Date(now - raw.dateOffset).toISOString(),
      title: raw.title,
      description: raw.description,
      sha: `${raw.sha}8376510394857120`,
      shortSha: raw.sha,
      url: `https://github.com/alexrivera/postpulse-app/commit/${raw.sha}`,
      stats,
      files: raw.files,
      rawDiffSnippet: raw.files[0]?.patchSnippet,
      worthiness,
      status: 'pending',
    };
  });
}
