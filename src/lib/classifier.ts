import { CommitCategory, FileChange, PostWorthiness } from '@/types';

interface ClassifyInput {
  title: string;
  description?: string;
  files: FileChange[];
  stats: {
    additions: number;
    deletions: number;
    totalFiles: number;
  };
}

export function classifyGitEvent(input: ClassifyInput): PostWorthiness {
  const text = `${input.title} ${input.description || ''}`.toLowerCase();
  const filePaths = input.files.map((f) => f.filename.toLowerCase());

  let score = 50;
  const reasons: string[] = [];
  let category: CommitCategory = 'chore_internal';
  let recommendedHook = '';

  // 1. Negative Signals / Chores
  const isChoreTitle =
    /^(chore|ci|build|test|deps|style|refactor\(lint\)|bump|version bump|update readme|fix typo|clean up|formatting)/i.test(
      input.title
    );
  const onlyLockFiles = filePaths.length > 0 && filePaths.every((p) =>
    p.includes('package-lock.json') ||
    p.includes('yarn.lock') ||
    p.includes('pnpm-lock.yaml') ||
    p.includes('cargo.lock') ||
    p.includes('poetry.lock')
  );
  const onlyDocs = filePaths.length > 0 && filePaths.every((p) =>
    p.endsWith('.md') || p.endsWith('.txt') || p.includes('docs/')
  );

  if (onlyLockFiles) {
    return {
      score: 15,
      category: 'chore_internal',
      reasons: ['Pure dependency lockfile update - no user or architectural impact.'],
      isWorthPosting: false,
      recommendedHook: 'Dependency bump (skip posting)',
    };
  }

  if (onlyDocs && isChoreTitle) {
    return {
      score: 20,
      category: 'chore_internal',
      reasons: ['Routine documentation or markdown typo fix.'],
      isWorthPosting: false,
      recommendedHook: 'Docs cleanup (skip posting)',
    };
  }

  // 2. High-Impact Category Detections
  // A. Database / Data Layer
  const isDbFile = filePaths.some(
    (p) =>
      p.includes('migration') ||
      p.includes('schema') ||
      p.endsWith('.sql') ||
      p.includes('prisma') ||
      p.includes('drizzle')
  );
  const isDbText =
    /migration|postgres|redis|sqlite|mongodb|sql|foreign key|index|query optimization|deadlock|pool|transaction/i.test(
      text
    );

  if (isDbFile || isDbText) {
    category = 'database_migration';
    score += 35;
    reasons.push('Database or data layer change detected - high interest for developer post-mortems');
    recommendedHook = 'Why we had to alter our database schema without taking downtime';
  }

  // B. Performance & Architecture
  const isPerfText =
    /perf|optimize|latency|speed|cache|redis|concurrency|race condition|memory leak|bottleneck|throughput|scale|async|worker|queue|bullmq|kafka/i.test(
      text
    );
  const isArchText =
    /rewrite|refactor|decouple|microservice|architecture|modularize|state machine|event-driven|pipeline/i.test(
      text
    );

  if (isPerfText && category === 'chore_internal') {
    category = 'performance';
    score += 35;
    reasons.push('Performance optimization or latency reduction - proven high engagement topic on r/webdev');
    recommendedHook = 'How a single bottleneck shaved 60% off our API response time';
  } else if (isArchText && category === 'chore_internal') {
    category = 'architecture';
    score += 30;
    reasons.push('Architectural refactoring - great for lessons learned and trade-off discussions');
    recommendedHook = 'Why our original architecture broke down and how we redesigned it';
  }

  // C. Bug War Stories / Incidents
  const isBugText =
    /fix|bug|incident|crash|panic|memory leak|infinite loop|edge case|outage|hotfix|regression|segfault|500 error/i.test(
      text
    );
  if (isBugText && category === 'chore_internal') {
    category = 'bug_war_story';
    score += 28;
    reasons.push('Bug fix with war story potential - vulnerability and debugging journeys perform well on Indie Hackers');
    recommendedHook = 'The weirdest edge-case bug that took us 12 hours to isolate';
  }

  // D. Security, Auth & Billing
  const isSecurityOrBilling =
    /auth|oauth|jwt|session|token|stripe|lemon ?squeezy|billing|checkout|security|csrf|cors|rate ?limit|idempotency/i.test(
      text
    );
  if (isSecurityOrBilling && (category === 'chore_internal' || category === 'bug_war_story')) {
    category = 'security_auth';
    score += 32;
    reasons.push('Billing or Auth changes involve critical real-world SaaS mechanics developers love analyzing');
    recommendedHook = 'What nobody tells you about handling webhook race conditions in Stripe';
  }

  // E. UI / UX Polish
  const isUiFile = filePaths.some(
    (p) =>
      p.includes('component') ||
      p.endsWith('.tsx') ||
      p.endsWith('.jsx') ||
      p.endsWith('.css') ||
      p.includes('tailwind')
  );
  const isUiText =
    /ui|ux|redesign|dark mode|responsive|mobile|onboarding|dashboard|modal|animation|toast|keyboard shortcut/i.test(
      text
    );

  if ((isUiText || isUiFile) && category === 'chore_internal') {
    category = 'ui_ux';
    score += 25;
    reasons.push('User interface polish or onboarding overhaul - high visual shareability on X and Reddit');
    recommendedHook = 'We redesigned our user onboarding: here are the 3 friction points we removed';
  }

  // F. New Features
  const isFeatureText = /feat|feature|add|implement|launch|introduce|support|integrate/i.test(text);
  if (isFeatureText && category === 'chore_internal') {
    category = 'new_feature';
    score += 25;
    reasons.push('New user-facing capability - great for changelog and product milestones');
    recommendedHook = 'Just shipped a feature users have been requesting for 2 months';
  }

  // 3. Diff Size and Depth Adjustments
  const totalChurn = input.stats.additions + input.stats.deletions;
  if (totalChurn > 400 && totalChurn < 2500) {
    score += 10;
    reasons.push(`Substantial code footprint (${totalChurn} lines changed across ${input.stats.totalFiles} files)`);
  } else if (totalChurn >= 2500) {
    score += 5;
    reasons.push('Massive changeset - contains rich context for an architecture breakdown');
  } else if (totalChurn < 10) {
    score -= 15;
    reasons.push('Trivial line count change (< 10 lines)');
  }

  // 4. Detailed commit message bonus
  if (input.description && input.description.length > 100) {
    score += 10;
    reasons.push('Commit includes detailed explanation of the rationale and trade-offs');
  }

  // Clamp score
  score = Math.max(10, Math.min(98, score));

  if (category === 'chore_internal' && score < 45) {
    reasons.push('Routine internal code maintenance with limited community appeal');
  }

  const isWorthPosting = score >= 50;

  return {
    score,
    category,
    reasons,
    isWorthPosting,
    recommendedHook: recommendedHook || input.title,
  };
}
