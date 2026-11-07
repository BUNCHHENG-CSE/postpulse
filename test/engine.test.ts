import { describe, it, expect } from 'bun:test';
import { classifyGitEvent } from '../src/lib/classifier';
import { generateHeadlineVariations, splitIntoTweetThread, getSubredditRecommendations } from '../src/lib/generator';
import { GitEvent } from '../src/types';

describe('PostPulse Engine Unit Tests', () => {
  it('classifies database migrations with high score', () => {
    const classification = classifyGitEvent({
      id: 'test_db',
      type: 'commit',
      repo: 'user/app',
      branch: 'main',
      author: { name: 'Developer', username: 'dev' },
      timestamp: new Date().toISOString(),
      title: 'perf(db): add composite partial index on events(org_id, created_at)',
      description: 'Fixes slow dashboard queries by stopping sequential table scans',
      sha: 'a89c201',
      shortSha: 'a89c201',
      url: 'https://github.com/user/app/commit/a89c201',
      stats: { additions: 36, deletions: 4, totalFiles: 2 },
      files: [
        { filename: 'prisma/migrations/20261014_add_event_idx.sql', status: 'added', additions: 24, deletions: 0 },
        { filename: 'src/server/queries/events.ts', status: 'modified', additions: 12, deletions: 4 },
      ],
      worthiness: { score: 0, category: 'chore_internal', reasons: [], isWorthPosting: false },
      status: 'pending',
    });

    expect(classification.category).toBe('database_migration');
    expect(classification.score).toBeGreaterThanOrEqual(80);
    expect(classification.recommendedHook).toBeDefined();
  });

  it('filters trivial chores with low score', () => {
    const classification = classifyGitEvent({
      id: 'test_chore',
      type: 'commit',
      repo: 'user/app',
      branch: 'main',
      author: { name: 'Developer', username: 'dev' },
      timestamp: new Date().toISOString(),
      title: 'chore(deps): bump tailwindcss and update lockfile',
      sha: 'f1a9b22',
      shortSha: 'f1a9b22',
      url: 'https://github.com/user/app/commit/f1a9b22',
      stats: { additions: 2, deletions: 2, totalFiles: 1 },
      files: [{ filename: 'package-lock.json', status: 'modified', additions: 2, deletions: 2 }],
      worthiness: { score: 0, category: 'chore_internal', reasons: [], isWorthPosting: false },
      status: 'pending',
    });

    expect(classification.score).toBeLessThan(40);
  });

  it('generates 5 viral headline angles', () => {
    const sampleEvent: GitEvent = {
      id: 'test_evt',
      type: 'commit',
      repo: 'user/app',
      branch: 'main',
      author: { name: 'Dev', username: 'dev' },
      timestamp: new Date().toISOString(),
      title: 'fix(billing): handle stripe webhook race condition',
      sha: 'c74f912',
      shortSha: 'c74f912',
      url: 'https://github.com',
      stats: { additions: 48, deletions: 14, totalFiles: 2 },
      files: [{ filename: 'src/app/api/webhooks/stripe/route.ts', status: 'modified', additions: 48, deletions: 14 }],
      category: 'security_auth',
      worthinessScore: 92,
      reasons: [],
      worthiness: {
        score: 92,
        category: 'security_auth',
        reasons: ['Billing security'],
        isWorthPosting: true,
      },
      status: 'pending',
    };

    const headlines = generateHeadlineVariations(sampleEvent);
    expect(headlines.length).toBe(5);
    expect(headlines[0].headline.length).toBeGreaterThan(10);
  });

  it('recommends targeted subreddits for database migrations', () => {
    const subs = getSubredditRecommendations('database_migration');
    expect(subs.length).toBeGreaterThan(0);
    expect(subs.some((s) => s.name === 'r/PostgreSQL')).toBe(true);
  });

  it('splits long markdown post into valid tweets (< 280 chars)', () => {
    const longContent = `We spent 14 hours chasing a phantom billing bug in Stripe webhooks.

Here is the exact problem: When a customer purchased via checkout session, invoice.payment_succeeded and checkout.session.completed fired within 40ms of each other.

Both endpoints passed verification and both provisioned 500 API credits. Result: users received double their purchased quota.

We solved this with an atomic Redis idempotency lock using SET NX EX 30.

3 key takeaways for indie devs:
1. Never trust webhook arrival ordering.
2. Make your credit grant idempotent with a transaction lock.
3. Add a database constraint to prevent negative balances.`;

    const tweets = splitIntoTweetThread(longContent);
    expect(tweets.length).toBeGreaterThan(1);
    tweets.forEach((tweet) => {
      expect(tweet.isValidLength).toBe(true);
      expect(tweet.charCount).toBeLessThanOrEqual(280);
    });
  });
});
