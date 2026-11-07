import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Load .env if present
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

let prisma;
if (isPostgres) {
  try {
    const { PrismaNeon } = await import('@prisma/adapter-neon');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const ws = (await import('ws')).default;
    if (!neonConfig.webSocketConstructor) {
      neonConfig.webSocketConstructor = ws;
    }
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaNeon(pool);
    prisma = new PrismaClient({ adapter });
  } catch {
    prisma = new PrismaClient();
  }
} else {
  prisma = new PrismaClient();
}

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const seedEvents = [
  {
    id: 'evt_commit_01',
    title: 'perf(db): add composite partial index on events(org_id, created_at) to stop sequential table scans',
    description: 'Fixes slow dashboard loading where queries on pending events took ~3.2s when row count crossed 250k. Added CONCURRENT index.',
    category: 'database_migration',
    score: 95,
    reasons: ['Database or data layer change detected - high interest for developer post-mortems', 'Substantial code footprint'],
    recommendedHook: 'Why our database locked under concurrent load (and the migration that fixed it)',
    files: [
      { filename: 'prisma/migrations/20261014_add_event_idx.sql', status: 'added', additions: 24, deletions: 0, patchSnippet: 'CREATE INDEX CONCURRENTLY idx_events_pending_org ON events (org_id, created_at DESC) WHERE status = "pending";' },
      { filename: 'src/server/queries/events.ts', status: 'modified', additions: 12, deletions: 4 }
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
    category: 'security_auth',
    score: 92,
    reasons: ['Billing or Auth changes involve critical real-world SaaS mechanics developers love analyzing'],
    recommendedHook: 'What nobody tells you about handling webhook race conditions in Stripe',
    files: [
      { filename: 'src/app/api/webhooks/stripe/route.ts', status: 'modified', additions: 48, deletions: 14, patchSnippet: 'const lock = await redis.set(`lock:stripe:${eventId}`, "1", "NX", "EX", 30);\nif (!lock) return res.status(200).send("Already processing");' },
      { filename: 'src/lib/redis.ts', status: 'modified', additions: 18, deletions: 2 }
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
    category: 'ui_ux',
    score: 85,
    reasons: ['User interface polish or onboarding overhaul - high visual shareability on X and Reddit'],
    recommendedHook: 'We redesigned our user onboarding: here are the 3 friction points we removed',
    files: [
      { filename: 'src/components/studio/SplitEditor.tsx', status: 'added', additions: 180, deletions: 0 },
      { filename: 'src/components/modals/WizardModal.tsx', status: 'removed', additions: 0, deletions: 210 },
      { filename: 'src/hooks/useKeyboardShortcuts.ts', status: 'added', additions: 42, deletions: 0 }
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
    category: 'performance',
    score: 90,
    reasons: ['Performance optimization or latency reduction - proven high engagement topic on r/webdev'],
    recommendedHook: 'How a single bottleneck shaved 60% off our API response time',
    files: [
      { filename: 'src/app/api/export/csv/route.ts', status: 'modified', additions: 64, deletions: 38, patchSnippet: 'const stream = new TransformStream();\nconst writer = stream.writable.getWriter();\n// pipe chunks directly to response' }
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
    category: 'security_auth',
    score: 88,
    reasons: ['Auth changes involve critical mechanics developers love analyzing'],
    recommendedHook: 'Preventing flash of unauthenticated state in React 19',
    files: [
      { filename: 'src/context/AuthContext.tsx', status: 'modified', additions: 35, deletions: 19 },
      { filename: 'src/lib/tokenManager.ts', status: 'modified', additions: 52, deletions: 8 }
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
    category: 'new_feature',
    score: 84,
    reasons: ['New user-facing capability with resilient worker backend'],
    recommendedHook: 'Building an exponential backoff webhook worker that never drops payloads',
    files: [
      { filename: 'src/services/webhookDispatcher.ts', status: 'added', additions: 145, deletions: 0 },
      { filename: 'src/queue/retryWorker.ts', status: 'added', additions: 92, deletions: 0 }
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
    category: 'performance',
    score: 95,
    reasons: ['Edge caching cuts origin load drastically'],
    recommendedHook: 'How edge stale-while-revalidate saved our origin server',
    files: [
      { filename: 'src/app/api/badges/[id]/route.ts', status: 'modified', additions: 22, deletions: 11, patchSnippet: 'headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");' }
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
    category: 'architecture',
    score: 90,
    reasons: ['Decoupling adapters from vendor APIs'],
    recommendedHook: 'Why our original architecture broke down and how we redesigned it',
    files: [
      { filename: 'src/core/git/GitProviderInterface.ts', status: 'added', additions: 78, deletions: 0 },
      { filename: 'src/core/git/GitHubAdapter.ts', status: 'modified', additions: 45, deletions: 90 },
      { filename: 'src/core/git/GitLabAdapter.ts', status: 'added', additions: 62, deletions: 0 }
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
    category: 'chore_internal',
    score: 50,
    reasons: ['Routine dependency update'],
    recommendedHook: 'chore: bump dependencies',
    files: [
      { filename: 'package.json', status: 'modified', additions: 1, deletions: 1 },
      { filename: 'package-lock.json', status: 'modified', additions: 142, deletions: 139 }
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
    category: 'bug_war_story',
    score: 63,
    reasons: ['Documentation fix with low code impact'],
    recommendedHook: 'Documentation tweak',
    files: [
      { filename: 'CONTRIBUTING.md', status: 'modified', additions: 2, deletions: 2 }
    ],
    additions: 2,
    deletions: 2,
    sha: '109ca88',
    dateOffset: 6.8 * day
  }
];

async function main() {
  console.log('Seeding database (SQLite / DATABASE_URL)...');

  // 1. Settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      productName: 'TCT PostPulse',
      productTagline: 'Turn your git commits into viral developer content automatically',
      targetAudience: 'Indie hackers, micro-SaaS founders, and full-stack software engineers',
      founderVoiceBio: 'Solo developer, ex-infrastructure engineer, no-nonsense technical tone with zero marketing hype',
      repoUrl: 'https://github.com/developer/tct-postpulse',
      githubWebhookSecret: 'dev_secret_content_engine_123',
      preferredModel: 'gpt-4o-mini',
      minScoreToDraft: 50,
      autoDraftOnWebhook: true,
    },
  });
  console.log('[OK] Settings initialized.');

  // 2. Events
  for (const evt of seedEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {
        title: evt.title,
        description: evt.description,
        worthinessScore: evt.score,
        category: evt.category,
        reasons: evt.reasons,
        recommendedHook: evt.recommendedHook,
        filesJson: evt.files,
        rawDiffSnippet: evt.files[0]?.patchSnippet,
      },
      create: {
        id: evt.id,
        type: 'commit',
        repo: 'alexrivera/tct-postpulse-app',
        branch: 'main',
        authorName: 'Alex Rivera',
        authorUsername: 'alexrivera',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        timestamp: new Date(now - evt.dateOffset),
        title: evt.title,
        description: evt.description,
        sha: `${evt.sha}8376510394857120`,
        shortSha: evt.sha,
        url: `https://github.com/alexrivera/tct-postpulse-app/commit/${evt.sha}`,
        additions: evt.additions,
        deletions: evt.deletions,
        totalFiles: evt.files.length,
        filesJson: evt.files,
        rawDiffSnippet: evt.files[0]?.patchSnippet,
        worthinessScore: evt.score,
        category: evt.category,
        reasons: evt.reasons,
        recommendedHook: evt.recommendedHook,
        status: 'pending',
      },
    });
  }
  console.log(`[OK] ${seedEvents.length} benchmark events upserted into database.`);

  // 3. Validation Grades
  const initialGrades = [
    { eventId: 'evt_commit_01', grade: 'ready_as_is', feedback: 'Accurately explains the partial index and EXPLAIN buffers query.' },
    { eventId: 'evt_commit_02', grade: 'ready_as_is', feedback: 'The Stripe webhook race condition resonates deeply. Good technical depth without hype.' },
    { eventId: 'evt_commit_03', grade: 'light_edits', feedback: 'Good split-view breakdown, just needed to tweak one sentence about modal framework.' },
    { eventId: 'evt_commit_04', grade: 'ready_as_is', feedback: 'TransformStream memory optimization breakdown is spot-on for r/node.' },
    { eventId: 'evt_commit_05', grade: 'light_edits', feedback: 'Solid explanation of token rotation race conditions.' },
  ];

  for (const g of initialGrades) {
    await prisma.validationGrade.upsert({
      where: { eventId: g.eventId },
      update: {
        grade: g.grade,
        developerFeedback: g.feedback,
      },
      create: {
        id: `grade_${g.eventId}`,
        eventId: g.eventId,
        grade: g.grade,
        developerFeedback: g.feedback,
        ratedAt: new Date(),
      },
    });
  }
  console.log('[OK] Benchmark validation grades initialized.');
  console.log('Database is fully seeded and ready for production!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
