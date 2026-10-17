import fs from 'fs/promises';
import path from 'path';
import { ContentDraft, EngineSettings, FileChange, GitEvent } from '@/types';
import { classifyGitEvent } from './classifier';
import { prisma, checkDatabaseConnection } from './db';

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

let hasInitializedDb = false;

async function ensurePostgresInitialized() {
  if (hasInitializedDb) return;
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      // Check if Settings exist, if not create default
      const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
      if (!settings) {
        await prisma.settings.create({
          data: {
            id: 'default',
            productName: DEFAULT_SETTINGS.productName,
            productTagline: DEFAULT_SETTINGS.productTagline,
            targetAudience: DEFAULT_SETTINGS.targetAudience,
            founderVoiceBio: DEFAULT_SETTINGS.founderVoiceBio,
            repoUrl: DEFAULT_SETTINGS.repoUrl,
            githubWebhookSecret: DEFAULT_SETTINGS.githubWebhookSecret,
            preferredModel: DEFAULT_SETTINGS.preferredModel,
            minScoreToDraft: DEFAULT_SETTINGS.minScoreToDraft,
            autoDraftOnWebhook: DEFAULT_SETTINGS.autoDraftOnWebhook,
          },
        });
      }

      // Check if events exist, if empty seed the 10 benchmark commits
      const count = await prisma.event.count();
      if (count === 0) {
        const seeded = getSeededEvents();
        for (const evt of seeded) {
          await prisma.event.create({
            data: {
              id: evt.id,
              type: evt.type,
              repo: evt.repo,
              branch: evt.branch,
              authorName: evt.author.name,
              authorUsername: evt.author.username,
              authorAvatarUrl: evt.author.avatarUrl,
              timestamp: new Date(evt.timestamp),
              title: evt.title,
              description: evt.description,
              sha: evt.sha,
              shortSha: evt.shortSha,
              url: evt.url,
              additions: evt.stats.additions,
              deletions: evt.stats.deletions,
              totalFiles: evt.stats.totalFiles,
              filesJson: evt.files as any,
              rawDiffSnippet: evt.rawDiffSnippet,
              worthinessScore: evt.worthiness.score,
              category: evt.worthiness.category,
              reasons: evt.worthiness.reasons as any,
              recommendedHook: evt.worthiness.recommendedHook,
              status: evt.status,
            },
          });
        }
      }
      hasInitializedDb = true;
    }
  } catch (err) {
    console.warn('PostgreSQL auto-initialization deferred:', err);
  }
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

export async function getSettings(): Promise<EngineSettings> {
  await ensurePostgresInitialized();
  try {
    const s = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (s) {
      return {
        productName: s.productName,
        productTagline: s.productTagline,
        targetAudience: s.targetAudience,
        founderVoiceBio: s.founderVoiceBio,
        repoUrl: s.repoUrl,
        githubWebhookSecret: s.githubWebhookSecret,
        githubToken: s.githubToken || undefined,
        openaiApiKey: s.openaiApiKey || undefined,
        anthropicApiKey: s.anthropicApiKey || undefined,
        geminiApiKey: s.geminiApiKey || undefined,
        preferredModel: s.preferredModel,
        minScoreToDraft: s.minScoreToDraft,
        autoDraftOnWebhook: s.autoDraftOnWebhook,
      };
    }
  } catch {
    // Fallback to file
  }

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
  await ensurePostgresInitialized();
  try {
    const updated = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        ...(settings.productName !== undefined && { productName: settings.productName }),
        ...(settings.productTagline !== undefined && { productTagline: settings.productTagline }),
        ...(settings.targetAudience !== undefined && { targetAudience: settings.targetAudience }),
        ...(settings.founderVoiceBio !== undefined && { founderVoiceBio: settings.founderVoiceBio }),
        ...(settings.repoUrl !== undefined && { repoUrl: settings.repoUrl }),
        ...(settings.githubWebhookSecret !== undefined && { githubWebhookSecret: settings.githubWebhookSecret }),
        ...(settings.githubToken !== undefined && { githubToken: settings.githubToken }),
        ...(settings.openaiApiKey !== undefined && { openaiApiKey: settings.openaiApiKey }),
        ...(settings.anthropicApiKey !== undefined && { anthropicApiKey: settings.anthropicApiKey }),
        ...(settings.geminiApiKey !== undefined && { geminiApiKey: settings.geminiApiKey }),
        ...(settings.preferredModel !== undefined && { preferredModel: settings.preferredModel }),
        ...(settings.minScoreToDraft !== undefined && { minScoreToDraft: settings.minScoreToDraft }),
        ...(settings.autoDraftOnWebhook !== undefined && { autoDraftOnWebhook: settings.autoDraftOnWebhook }),
      },
      create: {
        id: 'default',
        productName: settings.productName || DEFAULT_SETTINGS.productName,
        productTagline: settings.productTagline || DEFAULT_SETTINGS.productTagline,
        targetAudience: settings.targetAudience || DEFAULT_SETTINGS.targetAudience,
        founderVoiceBio: settings.founderVoiceBio || DEFAULT_SETTINGS.founderVoiceBio,
        repoUrl: settings.repoUrl || DEFAULT_SETTINGS.repoUrl,
        githubWebhookSecret: settings.githubWebhookSecret || DEFAULT_SETTINGS.githubWebhookSecret,
        preferredModel: settings.preferredModel || DEFAULT_SETTINGS.preferredModel,
        minScoreToDraft: settings.minScoreToDraft ?? DEFAULT_SETTINGS.minScoreToDraft,
        autoDraftOnWebhook: settings.autoDraftOnWebhook ?? DEFAULT_SETTINGS.autoDraftOnWebhook,
      },
    });

    return {
      productName: updated.productName,
      productTagline: updated.productTagline,
      targetAudience: updated.targetAudience,
      founderVoiceBio: updated.founderVoiceBio,
      repoUrl: updated.repoUrl,
      githubWebhookSecret: updated.githubWebhookSecret,
      githubToken: updated.githubToken || undefined,
      openaiApiKey: updated.openaiApiKey || undefined,
      anthropicApiKey: updated.anthropicApiKey || undefined,
      geminiApiKey: updated.geminiApiKey || undefined,
      preferredModel: updated.preferredModel,
      minScoreToDraft: updated.minScoreToDraft,
      autoDraftOnWebhook: updated.autoDraftOnWebhook,
    };
  } catch {
    // Fallback to file
  }

  await ensureDataDir();
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export async function getEvents(): Promise<GitEvent[]> {
  await ensurePostgresInitialized();
  try {
    const rows = await prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
    });

    if (rows.length > 0) {
      return rows.map(mapPrismaEventToGitEvent);
    }
  } catch {
    // Fallback to file
  }

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
  await ensurePostgresInitialized();
  try {
    const row = await prisma.event.findUnique({ where: { id } });
    if (row) return mapPrismaEventToGitEvent(row);
  } catch {
    // Fallback
  }

  const events = await getEvents();
  return events.find((e) => e.id === id) || null;
}

export async function saveEvent(event: GitEvent): Promise<GitEvent> {
  await ensurePostgresInitialized();
  try {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        description: event.description,
        worthinessScore: event.worthiness.score,
        category: event.worthiness.category,
        reasons: event.worthiness.reasons as any,
        recommendedHook: event.worthiness.recommendedHook,
        status: event.status,
        filesJson: event.files as any,
        rawDiffSnippet: event.rawDiffSnippet,
        additions: event.stats.additions,
        deletions: event.stats.deletions,
        totalFiles: event.stats.totalFiles,
      },
      create: {
        id: event.id,
        type: event.type,
        repo: event.repo,
        branch: event.branch,
        authorName: event.author.name,
        authorUsername: event.author.username,
        authorAvatarUrl: event.author.avatarUrl,
        timestamp: new Date(event.timestamp),
        title: event.title,
        description: event.description,
        sha: event.sha,
        shortSha: event.shortSha,
        url: event.url,
        additions: event.stats.additions,
        deletions: event.stats.deletions,
        totalFiles: event.stats.totalFiles,
        filesJson: event.files as any,
        rawDiffSnippet: event.rawDiffSnippet,
        worthinessScore: event.worthiness.score,
        category: event.worthiness.category,
        reasons: event.worthiness.reasons as any,
        recommendedHook: event.worthiness.recommendedHook,
        status: event.status,
      },
    });
  } catch {
    // Fallback to file
  }

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
  try {
    await prisma.event.update({
      where: { id },
      data: { status },
    });
  } catch {
    // Fallback
  }

  const events = await getEvents();
  const target = events.find((e) => e.id === id);
  if (target) {
    target.status = status;
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await prisma.event.delete({ where: { id } });
  } catch {
    // Fallback
  }

  const events = await getEvents();
  const filtered = events.filter((e) => e.id !== id);
  await fs.writeFile(EVENTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
}

export async function getDrafts(): Promise<ContentDraft[]> {
  await ensurePostgresInitialized();
  try {
    const rows = await prisma.draft.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length > 0) {
      return rows.map(mapPrismaDraftToContentDraft);
    }
  } catch {
    // Fallback
  }

  await ensureDataDir();
  try {
    const data = await fs.readFile(DRAFTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getDraftsByEventId(eventId: string): Promise<ContentDraft[]> {
  await ensurePostgresInitialized();
  try {
    const rows = await prisma.draft.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length > 0) {
      return rows.map(mapPrismaDraftToContentDraft);
    }
  } catch {
    // Fallback
  }

  const drafts = await getDrafts();
  return drafts.filter((d) => d.eventId === eventId);
}

export async function saveDraft(draft: ContentDraft): Promise<ContentDraft> {
  await ensurePostgresInitialized();
  try {
    await prisma.draft.upsert({
      where: { id: draft.id },
      update: {
        title: draft.title,
        hook: draft.hook,
        content: draft.content,
        tone: draft.tone,
        wordCount: draft.wordCount,
        publishChecklist: draft.publishChecklist as any,
        estimatedReadTime: draft.estimatedReadTime,
        isEdited: draft.isEdited,
        publishedUrl: draft.publishedUrl,
      },
      create: {
        id: draft.id,
        eventId: draft.eventId,
        format: draft.format,
        targetPlatform: draft.targetPlatform,
        platformName: draft.platformName,
        title: draft.title,
        hook: draft.hook,
        content: draft.content,
        tone: draft.tone,
        wordCount: draft.wordCount,
        publishChecklist: draft.publishChecklist as any,
        estimatedReadTime: draft.estimatedReadTime,
        isEdited: draft.isEdited,
        publishedUrl: draft.publishedUrl,
        createdAt: new Date(draft.createdAt),
      },
    });
  } catch {
    // Fallback
  }

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
  try {
    const updated = await prisma.draft.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.hook !== undefined && { hook: updates.hook }),
        ...(updates.content && { content: updates.content }),
        ...(updates.tone && { tone: updates.tone }),
        ...(updates.wordCount !== undefined && { wordCount: updates.wordCount }),
        ...(updates.publishChecklist && { publishChecklist: updates.publishChecklist as any }),
        ...(updates.estimatedReadTime && { estimatedReadTime: updates.estimatedReadTime }),
        isEdited: true,
      },
    });
    return mapPrismaDraftToContentDraft(updated);
  } catch {
    // Fallback
  }

  const drafts = await getDrafts();
  const target = drafts.find((d) => d.id === id);
  if (!target) return null;

  Object.assign(target, updates, { updatedAt: new Date().toISOString(), isEdited: true });
  await fs.writeFile(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
  return target;
}

export async function resetToDefaultDataset(): Promise<GitEvent[]> {
  const seeded = getSeededEvents();
  try {
    await prisma.draft.deleteMany({});
    await prisma.event.deleteMany({});
    for (const evt of seeded) {
      await prisma.event.create({
        data: {
          id: evt.id,
          type: evt.type,
          repo: evt.repo,
          branch: evt.branch,
          authorName: evt.author.name,
          authorUsername: evt.author.username,
          authorAvatarUrl: evt.author.avatarUrl,
          timestamp: new Date(evt.timestamp),
          title: evt.title,
          description: evt.description,
          sha: evt.sha,
          shortSha: evt.shortSha,
          url: evt.url,
          additions: evt.stats.additions,
          deletions: evt.stats.deletions,
          totalFiles: evt.stats.totalFiles,
          filesJson: evt.files as any,
          rawDiffSnippet: evt.rawDiffSnippet,
          worthinessScore: evt.worthiness.score,
          category: evt.worthiness.category,
          reasons: evt.worthiness.reasons as any,
          recommendedHook: evt.worthiness.recommendedHook,
          status: evt.status,
        },
      });
    }
  } catch {
    // Fallback
  }

  await ensureDataDir();
  await fs.writeFile(EVENTS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
  await fs.writeFile(DRAFTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  return seeded;
}

function mapPrismaEventToGitEvent(row: any): GitEvent {
  const files: FileChange[] = Array.isArray(row.filesJson) ? row.filesJson : [];
  const reasons: string[] = Array.isArray(row.reasons) ? row.reasons : [];

  return {
    id: row.id,
    type: row.type as any,
    repo: row.repo,
    branch: row.branch,
    author: {
      name: row.authorName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl || undefined,
    },
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
    title: row.title,
    description: row.description || undefined,
    sha: row.sha,
    shortSha: row.shortSha,
    url: row.url,
    stats: {
      additions: row.additions,
      deletions: row.deletions,
      totalFiles: row.totalFiles,
    },
    files,
    rawDiffSnippet: row.rawDiffSnippet || undefined,
    worthiness: {
      score: row.worthinessScore,
      category: row.category as any,
      reasons,
      isWorthPosting: row.worthinessScore >= 50,
      recommendedHook: row.recommendedHook || undefined,
    },
    status: row.status as any,
  };
}

function mapPrismaDraftToContentDraft(row: any): ContentDraft {
  const checklist: string[] = Array.isArray(row.publishChecklist) ? row.publishChecklist : [];

  return {
    id: row.id,
    eventId: row.eventId,
    format: row.format as any,
    targetPlatform: row.targetPlatform as any,
    platformName: row.platformName,
    title: row.title,
    hook: row.hook || '',
    content: row.content,
    tone: row.tone as any,
    wordCount: row.wordCount,
    publishChecklist: checklist,
    estimatedReadTime: row.estimatedReadTime,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    isEdited: row.isEdited,
    publishedUrl: row.publishedUrl || undefined,
  };
}

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
