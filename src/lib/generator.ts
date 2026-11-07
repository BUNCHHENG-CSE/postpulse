import {
  ContentDraft,
  DraftFormat,
  EngineSettings,
  GitEvent,
  HeadlineVariation,
  SubredditRecommendation,
  ToneStyle,
  TweetThreadItem,
  WeeklyDigest,
} from '@/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

export async function generateDraft(
  event: GitEvent,
  format: DraftFormat,
  settings: EngineSettings,
  toneOverride?: ToneStyle
): Promise<ContentDraft> {
  const tone = toneOverride || (format === 'changelog' ? 'crisp_minimal' : 'authentic_raw');
  const now = new Date().toISOString();

  // Try calling real LLM if API keys are configured
  let generatedContent = '';
  const apiKey =
    settings.openaiApiKey ||
    process.env.OPENAI_API_KEY ||
    settings.anthropicApiKey ||
    process.env.ANTHROPIC_API_KEY ||
    settings.geminiApiKey ||
    process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      generatedContent = await callLlmProvider(event, format, tone, settings);
    } catch (err) {
      console.warn('External LLM call failed, falling back to calibrated template engine:', err);
      generatedContent = generateCalibratedFallback(event, format, tone, settings);
    }
  } else {
    // Calibrated deterministic builder tuned to high-engagement developer formulas
    generatedContent = generateCalibratedFallback(event, format, tone, settings);
  }

  // Extract a clean title & hook
  const { title, hook, cleanBody } = extractTitleAndHook(generatedContent, event, format);

  const wordCount = cleanBody.split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = `${Math.max(1, Math.ceil(wordCount / 180))} min read`;

  const platformMap: Record<DraftFormat, { platform: ContentDraft['targetPlatform']; name: string }> = {
    technical_lesson: { platform: 'reddit', name: 'Reddit (r/SideProject, r/webdev)' },
    build_in_public: { platform: 'indie_hackers', name: 'Indie Hackers & LinkedIn' },
    changelog: { platform: 'changelog', name: 'Public Product Changelog' },
  };

  const checklistMap: Record<DraftFormat, string[]> = {
    technical_lesson: [
      'Verified code snippets compile or match actual diff logic',
      'Stripped company-internal URLs and sensitive credentials',
      'Checked that the tone invites constructive critique rather than self-promotion',
      'Included concrete before/after metrics or error symptom',
    ],
    build_in_public: [
      'Hook resonates with developer struggle or founder reality',
      'Explained why this feature took time or what trade-off was made',
      'Ended with an open question to encourage comments and discussion',
      'Formatted with line breaks for fast mobile scanning',
    ],
    changelog: [
      'Lead with user benefit over internal git terminology',
      'Kept to under 3 sentences for high readability',
      'Highlighted performance multipliers or workflow improvements',
    ],
  };

  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId: event.id,
    format,
    targetPlatform: platformMap[format].platform,
    platformName: platformMap[format].name,
    title,
    hook,
    content: cleanBody,
    tone,
    wordCount,
    publishChecklist: checklistMap[format],
    estimatedReadTime,
    createdAt: now,
    updatedAt: now,
    isEdited: false,
  };
}

async function callLlmProvider(
  event: GitEvent,
  format: DraftFormat,
  tone: ToneStyle,
  settings: EngineSettings
): Promise<string> {
  const systemPrompt = buildSystemPrompt(format, event.worthiness.category, tone);
  const userPrompt = buildUserPrompt({
    event,
    format,
    tone,
    productName: settings.productName,
    productTagline: settings.productTagline,
    founderVoiceBio: settings.founderVoiceBio,
  });

  const openaiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
  const anthropicKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const geminiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: settings.preferredModel || process.env.LLM_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  }

  if (anthropicKey) {
    const anthropicModel =
      settings.preferredModel?.startsWith('claude') ? settings.preferredModel : 'claude-3-5-sonnet-20241022';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: anthropicModel,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.content[0]?.text || '';
  }

  if (geminiKey) {
    const geminiModel =
      settings.preferredModel?.startsWith('gemini') ? settings.preferredModel : 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  throw new Error('No LLM key available');
}

/**
 * Calibrated fallback generator that generates realistic, non-generic developer posts
 * based on the commit's category, diff, and developer context.
 */
function generateCalibratedFallback(
  event: GitEvent,
  format: DraftFormat,
  tone: ToneStyle,
  settings: EngineSettings
): string {
  const prod = settings.productName || 'our SaaS';
  const cat = event.worthiness.category;
  const changedFiles = event.files.map((f) => f.filename).slice(0, 3).join(', ');

  if (format === 'technical_lesson') {
    return generateTechnicalLessonFallback(event, prod, cat, changedFiles);
  }

  if (format === 'build_in_public') {
    return generateBuildInPublicFallback(event, prod, cat, changedFiles);
  }

  // Changelog
  return generateChangelogFallback(event, prod, cat);
}

function generateTechnicalLessonFallback(
  event: GitEvent,
  prod: string,
  cat: string,
  changedFiles: string
): string {
  switch (cat) {
    case 'database_migration':
      return `# Why our database locked under concurrent load (and the migration that fixed it)

We recently hit a nasty issue in **${prod}** where database response times spiked from ~45ms to over 3.2 seconds during peak usage. 

### The Bottleneck
When inspecting slow queries, we noticed full table scans on queries that should have hit an index. Worse, a foreign key cascade without an explicit index on the child table was taking out row-level locks across the entire table during updates:

\`\`\`sql
-- The problematic query causing lock contention
SELECT * FROM events 
WHERE org_id = $1 AND status = 'pending' 
ORDER BY created_at DESC 
LIMIT 50;
\`\`\`

Because \`org_id\` had low cardinality and \`created_at\` was separate, Postgres chose a sequential scan over the combined index when the row count surpassed 250k.

### The Fix
In commit \`${event.shortSha}\` (\`${event.title}\`), we migrated the schema across ${changedFiles}:

\`\`\`sql
-- Added composite partial index to avoid scanning historical completed rows
CREATE INDEX CONCURRENTLY idx_events_pending_org 
ON events (org_id, created_at DESC) 
WHERE status = 'pending';
\`\`\`

Using \`CONCURRENTLY\` ensured zero downtime while building the index on production data.

### Key Takeaways
1. **Never assume a single-column index will satisfy a compound filter + sort.** Run \`EXPLAIN (ANALYZE, BUFFERS)\` with production-scale data.
2. **Partial indexes are underrated.** If 90% of your records are in an archived/done state, index only the 10% active workload.
3. **Always use CONCURRENTLY in production migrations** to prevent write locks on high-throughput tables.

Has anyone else dealt with Postgres index bloat on append-heavy tables? What's your pruning strategy?`;

    case 'performance':
      return `# Shaving 65% off latency by fixing an accidental N+1 loop

In **${prod}**, our main list endpoint was getting slower with every new account onboarded. Here's what we discovered when profiling commit \`${event.shortSha}\`.

### What was happening
We had a clean abstraction that looked great in code reviews:
\`\`\`typescript
// Looked innocent, but triggered 50+ network roundtrips
const users = await getUsers(orgId);
const usersWithStats = await Promise.all(
  users.map(async (u) => ({
    ...u,
    metrics: await calculateDailyMetrics(u.id)
  }))
);
\`\`\`

In local dev with 3 test accounts, it was instantaneous. In staging with 120 accounts, it fired 121 roundtrips.

### The Refactor (${changedFiles})
We replaced the distributed calls with a single batched aggregation query:
\`\`\`typescript
const [users, metricsMap] = await Promise.all([
  getUsers(orgId),
  getAggregatedMetricsByOrg(orgId)
]);
\`\`\`

### Results
- P95 latency dropped from **820ms → 140ms**
- Database CPU dropped by 40%
- Memory allocation stabilized under concurrent spikes

**Lesson**: Abstractions that hide data boundaries are dangerous in ORMs. If you're doing \`Promise.all(arr.map(fetch))\`, batch it before you deploy.`;

    case 'bug_war_story':
      return `# The subtle concurrency bug that survived our entire test suite

We just pushed hotfix \`${event.shortSha}\`: "${event.title}". Here is the post-mortem of how this bug occurred and how we caught it.

### The Symptom
Users reported intermittent duplicate entries when clicking save in rapid succession on poor cellular connections. Our tests had passed with 100% code coverage.

### Why Tests Didn't Catch It
In unit tests, mocked responses resolve sequentially in deterministic order. In real-world networks:
1. Request A fired at 0ms.
2. Request B fired at 150ms.
3. Request B arrived at the server *before* Request A completed its database transaction.
4. Both requests passed the "does record already exist?" check simultaneously.

### The Fix (${changedFiles})
We added an atomic idempotency constraint with a unique hash token:
\`\`\`typescript
// Idempotency check with Redis atomic lock
const lockAcquired = await redis.set(\`lock:\${userId}:\${idempotencyKey}\`, '1', 'NX', 'EX', 10);
if (!lockAcquired) {
  return res.status(409).json({ error: 'Request in flight' });
}
\`\`\`

### Takeaway
Never rely solely on client-side button debouncing or in-memory checks for state mutation. Treat all incoming requests as potentially concurrent.`;

    case 'security_auth':
      return `# What we learned securing our webhook handler against replay attacks

We just revamped our webhook verification in **${prod}** (\`${event.title}\`). Webhook handling is deceptively tricky to get right for SaaS applications.

### The Vulnerability Vector
Verifying the HMAC signature is only step one. If an attacker intercepts a valid signed payload, they can replay it multiple times to drain quota or trigger redundant billing logic.

### Implementation (${changedFiles})
We implemented a strict timestamp tolerance window + nonce deduplication:
\`\`\`typescript
const toleranceSeconds = 300; // 5 min replay threshold
const timestamp = parseInt(headers['x-signature-timestamp'], 10);

if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
  throw new Error('Webhook timestamp outside acceptable drift window');
}
\`\`\`

Combined with constant-time cryptographic comparison (\`crypto.timingSafeEqual\`), this completely mitigates timing attacks and replay windows.

Are you storing webhook idempotency keys in Redis or your primary database?`;

    case 'ui_ux':
      return `# Why we ripped out our multi-step modal for an inline workflow

In commit \`${event.shortSha}\` (${event.title}), we redesigned the core creation flow in **${prod}**.

### The Problem
Our analytics showed a 28% drop-off between step 2 and step 3 in our previous configuration modal. When interviewing 5 users, the consensus was clear: "I don't know what values to put here until I see the preview."

### What We Changed (${changedFiles})
- Scrapped the 3-step modal dialog in favor of an interactive split-view editor.
- Live updates trigger immediately with zero layout shifts.
- Added sensible developer defaults with keyboard shortcuts (\`Cmd+Enter\` to publish).

### Takeaway
Modals interrupt spatial context. If your user needs to reference existing screen data to complete a form, don't trap them inside a modal. Inline split-screens with instant feedback consistently convert better.`;

    default:
      return `# Deep Dive into ${event.title}

In commit \`${event.shortSha}\`, we refactored core logic across ${changedFiles} (+${event.stats.additions}/-${event.stats.deletions} lines).

### Context & Goal
As **${prod}** evolved, this module accumulated technical debt that slowed down feature velocity. 

### What Changed
- Decoupled state management from direct network calls.
- Enforced strict TypeScript contracts to catch malformed payloads at compile time.
- Reduced overall file complexity while adding test coverage for previously untested edge cases.

### Practical Insight
When refactoring legacy code in a live SaaS, ship in atomic, self-contained commits rather than mega-branches. It makes regression isolation trivial.`;
  }
}

function generateBuildInPublicFallback(
  event: GitEvent,
  prod: string,
  cat: string,
  changedFiles: string
): string {
  switch (cat) {
    case 'database_migration':
      return `Database migrations in production are always a white-knuckle moment.

I spent this morning running a schema migration for ${prod} across ${changedFiles}. 

The context: We had queries starting to slow down as customer data grew, and I kept putting off the index refactor because "what if the lock freezes production writes?"

Instead of waiting for a 2 AM crisis, I finally sat down, wrote a non-blocking migration using CONCURRENT indexes, and tested the rollback scripts three times on a staging replica.

Ran it today. Zero downtime. P95 query times dropped from ~850ms to under 50ms.

Solo founder reminder: The scary technical debt you keep delaying is usually 2 hours of focused work once you stop procrastinating.

How do you handle migrations on your side projects?`;

    case 'performance':
      return `P95 latency: 820ms ➡️ 140ms.

One of the hardest parts of being a solo dev is you don't notice latency creeping in because local dev is always blazing fast.

A user mentioned ${prod} felt "a bit sluggish on dashboard load". I opened the network tab, ran a trace, and found an accidental N+1 loop firing dozens of requests.

Commit \`${event.shortSha}\` replaced it with a single batched query.

Shipping updates isn't just about shiny new features. Sometimes the most satisfying commits are the ones that make existing features feel snappy and reliable.

Back to building! 🛠️`;

    case 'bug_war_story':
      return `Spent 4 hours tracking down a bug that turned out to be a 3-line concurrency edge case.

A customer reported a duplicate entry bug in ${prod}. My first instinct was "that's impossible, we have tests for this."

Turns out: on spotty mobile networks, two requests were arriving within 40 milliseconds of each other, bypassing our in-memory check before the first transaction completed.

Fixed in commit \`${event.shortSha}\` with atomic Redis locks and idempotency keys.

Humbling reminder: tests verify what you thought of; real users verify what you didn't.`;

    case 'ui_ux':
      return `Killed our 3-step setup modal today.

When building ${prod}, I thought a guided wizard modal was "clean UX". 

Then I looked at the drop-off numbers: 28% of users abandoned the app mid-modal.

In commit \`${event.shortSha}\`, I replaced the entire modal with an inline split-view editor. Instant preview, zero popup friction, keyboard shortcuts enabled.

Early test feedback: users finish setup in 40 seconds instead of 3 minutes.

Don't be afraid to throw away code you spent days building if the data tells you users hate it.`;

    default:
      return `Just pushed \`${event.shortSha}\` to ${prod}: "${event.title}".

(+${event.stats.additions} / -${event.stats.deletions} lines across ${changedFiles})

One rule I try to follow as a solo developer: never let a week go by without shipping code that either removes friction or improves reliability for users.

Small daily commits compound into a serious product. 

What did you ship today?`;
  }
}

function generateChangelogFallback(event: GitEvent, prod: string, cat: string): string {
  switch (cat) {
    case 'database_migration':
    case 'performance':
      return `⚡ **Performance**: Sped up query response times by up to 70%. Dashboard and event queries now load under 150ms with optimized database indexes.`;
    case 'bug_war_story':
      return `🛠️ **Fixed**: Resolved an edge-case concurrency issue that could cause duplicate submissions on unstable mobile connections. Added automatic request idempotency.`;
    case 'security_auth':
      return `🔒 **Security**: Enhanced webhook verification with strict replay attack protection and constant-time signature validation.`;
    case 'ui_ux':
      return `✨ **Improved**: Replaced the setup modal with a responsive split-view editor with live previews and keyboard shortcuts (\`Cmd+Enter\`).`;
    default:
      return `🚀 **Update**: ${event.title} - improved reliability and system stability for ${prod}.`;
  }
}

function extractTitleAndHook(
  raw: string,
  event: GitEvent,
  format: DraftFormat
): { title: string; hook: string; cleanBody: string } {
  let cleanBody = raw.trim();
  let title = event.title;
  let hook = '';

  // Look for first markdown header # Title
  const headerMatch = cleanBody.match(/^#\s+(.+)$/m);
  if (headerMatch) {
    title = headerMatch[1].replace(/\*\*/g, '').trim();
  } else if (format === 'technical_lesson') {
    title = `How we solved: ${event.title}`;
  } else if (format === 'build_in_public') {
    title = `${event.title} — Build in Public Notes`;
  } else {
    title = `Release: ${event.title}`;
  }

  // Extract first 1-2 sentences as hook
  const lines = cleanBody
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (lines.length > 0) {
    hook = lines[0].slice(0, 160);
  }

  return { title, hook, cleanBody };
}

/**
 * Splits a long-form draft into sequential 280-character tweets with numbered headers/footers.
 */
export function splitIntoTweetThread(content: string, hookTitle?: string): TweetThreadItem[] {
  if (!content) return [];

  // Strip top markdown header if redundant
  let body = content.replace(/^#\s+[^\n]+\n+/, '').trim();

  // Split into paragraphs
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const rawTweets: string[] = [];

  // Tweet 1: Hook Tweet
  const opener = hookTitle
    ? `🧵 1/ [Hook]\n\n${hookTitle}\n\nHere is what broke and how we solved it: 👇`
    : `🧵 1/ [Dev Story]\n\n${paragraphs[0] || 'Building in public update: 👇'}`;

  rawTweets.push(opener);

  // If we used paragraph 0 for opener without hookTitle, skip it
  const remaining = hookTitle ? paragraphs : paragraphs.slice(1);

  for (const para of remaining) {
    // Convert markdown subheadings to bold text
    let cleaned = para.replace(/^#{1,4}\s+(.+)$/gm, '**$1**');

    // If paragraph fits comfortably under 240 chars (leaving room for numbering)
    if (cleaned.length <= 240) {
      rawTweets.push(cleaned);
    } else {
      // Split by sentence endings
      const sentences = cleaned.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [cleaned];
      let currentChunk = '';
      for (const sent of sentences) {
        if ((currentChunk + sent).length <= 240) {
          currentChunk += sent;
        } else {
          if (currentChunk.trim()) rawTweets.push(currentChunk.trim());
          currentChunk = sent;
        }
      }
      if (currentChunk.trim()) rawTweets.push(currentChunk.trim());
    }
  }

  // Ensure at least 2 tweets
  if (rawTweets.length === 1 && paragraphs.length > 0) {
    rawTweets.push(paragraphs.join('\n\n').slice(0, 240));
  }

  const total = rawTweets.length;
  return rawTweets.map((text, idx) => {
    const num = idx + 1;
    let formatted = text;
    if (idx === 0) {
      formatted = text.replace('1/', `1/${total}`);
    } else {
      formatted = `${num}/${total}\n\n${text}`;
    }
    return {
      index: num,
      total,
      text: formatted,
      charCount: formatted.length,
      isValidLength: formatted.length <= 280,
    };
  });
}

/**
 * Generates 5 high-converting, psychologically distinct headline variations for a commit.
 */
export function generateHeadlineVariations(
  event: GitEvent,
  settings?: EngineSettings
): HeadlineVariation[] {
  const title = event.title.replace(/^[a-z]+\([^)]+\):\s*/i, '').replace(/^[a-z]+:\s*/i, '');
  const cat = event.worthiness.category;
  const prod = settings?.productName || 'our SaaS';
  const churn = `+${event.stats.additions} / -${event.stats.deletions}`;

  const headlines: HeadlineVariation[] = [];

  switch (cat) {
    case 'database_migration':
      headlines.push(
        {
          id: 'war_story',
          angle: 'war_story',
          label: 'The Outage / War Story',
          headline: `The database deadlock that almost crippled our production cluster during peak traffic`,
          explanation: 'Builds intense curiosity around a real near-miss outage.',
        },
        {
          id: 'metric',
          angle: 'metric',
          label: 'The Data / Latency Win',
          headline: `How 1 partial composite index slashed dashboard query latency by 85% (${churn} lines)`,
          explanation: 'Specific percentage drop and line metrics trigger high developer clicks.',
        },
        {
          id: 'contrarian',
          angle: 'contrarian',
          label: 'The Contrarian Take',
          headline: `Why naive ORM migrations silently destroy Postgres database performance at scale`,
          explanation: 'Challenges default developer tooling and sparks lively comments.',
        },
        {
          id: 'vulnerable',
          angle: 'vulnerable',
          label: 'Founder Vulnerability',
          headline: `I delayed this database refactor for 3 weeks because I was terrified of breaking user data`,
          explanation: 'Radical honesty about imposter syndrome and technical fear.',
        },
        {
          id: 'how_to',
          angle: 'how_to',
          label: 'Practical Engineering Tutorial',
          headline: `Postgres Table Locks Explained: How we migrated high-traffic tables with zero downtime`,
          explanation: 'Evergreen technical guide format favored on Reddit r/webdev and HN.',
        }
      );
      break;

    case 'bug_war_story':
      headlines.push(
        {
          id: 'war_story',
          angle: 'war_story',
          label: 'The Outage / War Story',
          headline: `We almost lost customer transactions to a 3-millisecond webhook race condition`,
          explanation: 'Suspenseful incident hook describing a catastrophic edge case.',
        },
        {
          id: 'metric',
          angle: 'metric',
          label: 'The Data / Latency Win',
          headline: `Spent 6 hours hunting a production ghost bug. The fix took exactly 4 lines of code.`,
          explanation: 'Relatable ratio of debugging pain to minimal code fix.',
        },
        {
          id: 'contrarian',
          angle: 'contrarian',
          label: 'The Contrarian Take',
          headline: `Why your integration tests won't catch concurrency bugs (and what to do instead)`,
          explanation: 'Pushes back on conventional test suites.',
        },
        {
          id: 'vulnerable',
          angle: 'vulnerable',
          label: 'Founder Vulnerability',
          headline: `I felt sick when a customer sent a screenshot of our duplicate billing bug`,
          explanation: 'Raw founder emotion that connects instantly with indie makers.',
        },
        {
          id: 'how_to',
          angle: 'how_to',
          label: 'Practical Engineering Tutorial',
          headline: `How to implement atomic idempotency locks in Redis without deadlocks`,
          explanation: 'Actionable code recipe with immediate utility.',
        }
      );
      break;

    case 'performance':
      headlines.push(
        {
          id: 'metric',
          angle: 'metric',
          label: 'The Data / Latency Win',
          headline: `Benchmarking our streaming engine: Cutting peak memory usage by 92% (${churn} lines)`,
          explanation: 'Direct before/after benchmark metric.',
        },
        {
          id: 'war_story',
          angle: 'war_story',
          label: 'The Outage / War Story',
          headline: `How an unnoticed memory leak almost pushed our server past its 4GB RAM threshold`,
          explanation: 'Drama around server threshold limits.',
        },
        {
          id: 'contrarian',
          angle: 'contrarian',
          label: 'The Contrarian Take',
          headline: `Stop buffering large files in memory: Why Node.js TransformStream should be your default`,
          explanation: 'Definite strong opinion backed by practical experience.',
        },
        {
          id: 'vulnerable',
          angle: 'vulnerable',
          label: 'Founder Vulnerability',
          headline: `I ignored our server memory graphs for a month until our first customer complained`,
          explanation: 'Admitting neglect and highlighting the wake-up call.',
        },
        {
          id: 'how_to',
          angle: 'how_to',
          label: 'Practical Engineering Tutorial',
          headline: `Step-by-step: Profiling Node.js memory leaks with heap snapshots and Chrome DevTools`,
          explanation: 'Hands-on tutorial with concrete tooling.',
        }
      );
      break;

    case 'ui_ux':
      headlines.push(
        {
          id: 'metric',
          angle: 'metric',
          label: 'The Data / Conversion Win',
          headline: `We killed our 3-step setup modal. Onboarding completion jumped by 34%.`,
          explanation: 'Clear correlation between UI decision and business metrics.',
        },
        {
          id: 'contrarian',
          angle: 'contrarian',
          label: 'The Contrarian Take',
          headline: `Why modal wizards are the lazy developer's trap for bad user onboarding`,
          explanation: 'Provocative design critique.',
        },
        {
          id: 'vulnerable',
          angle: 'vulnerable',
          label: 'Founder Vulnerability',
          headline: `I threw away 500 lines of UI code I spent a week building because users hated it`,
          explanation: 'Sunken cost fallacy and founder humility.',
        },
        {
          id: 'war_story',
          angle: 'war_story',
          label: 'The Outage / War Story',
          headline: `Watching a user get stuck on our onboarding in a recorded session was painful`,
          explanation: 'User testing war story.',
        },
        {
          id: 'how_to',
          angle: 'how_to',
          label: 'Practical Engineering Tutorial',
          headline: `How to build a buttery-smooth split-view Markdown editor with keyboard shortcuts in React`,
          explanation: 'Frontend developer walkthrough with high bookmark appeal.',
        }
      );
      break;

    default:
      headlines.push(
        {
          id: 'war_story',
          angle: 'war_story',
          label: 'The Engineering Reality',
          headline: `What nobody tells you about shipping ${title} in a bootstrap product`,
          explanation: 'Appeals to indie hacker realism.',
        },
        {
          id: 'metric',
          angle: 'metric',
          label: 'The Metric Win',
          headline: `Shipped ${title} (${churn} lines): What our first week of metrics looks like`,
          explanation: 'Data-driven devlog format.',
        },
        {
          id: 'contrarian',
          angle: 'contrarian',
          label: 'The Contrarian Take',
          headline: `Why we built ${title} from scratch instead of paying for a third-party API`,
          explanation: 'Build vs Buy debate generates high comment counts.',
        },
        {
          id: 'vulnerable',
          angle: 'vulnerable',
          label: 'Founder Vulnerability',
          headline: `I spent 4 days on ${title}. Was it worth delaying other roadmap features?`,
          explanation: 'Invites the community to weigh in on roadmap prioritization.',
        },
        {
          id: 'how_to',
          angle: 'how_to',
          label: 'Practical Engineering Tutorial',
          headline: `Architecture breakdown: How we decoupled and shipped ${title} in ${prod}`,
          explanation: 'High-value code design overview.',
        }
      );
      break;
  }

  return headlines;
}

/**
 * Recommends community-verified subreddits and posting advice based on commit category.
 */
export function getSubredditRecommendations(category: string): SubredditRecommendation[] {
  const baseRedditUrl = 'https://www.reddit.com/r/';

  switch (category) {
    case 'database_migration':
      return [
        {
          name: 'r/PostgreSQL',
          sub: 'PostgreSQL',
          matchReason: 'Direct domain fit for table locks, index tuning, and schema migration strategies.',
          recommendedFlair: 'Discussion',
          antiBanTips: 'Keep it 100% technical. Include EXPLAIN ANALYZE or SQL snippets. Do not link your product in the first paragraph.',
          url: `${baseRedditUrl}PostgreSQL/submit`,
        },
        {
          name: 'r/webdev',
          sub: 'webdev',
          matchReason: 'Massive audience (2.1M) for backend performance lessons and architectural war stories.',
          recommendedFlair: 'Showoff Saturday',
          antiBanTips: 'Follow the 9:1 participation rule. Focus on lessons learned for fellow full-stack devs.',
          url: `${baseRedditUrl}webdev/submit`,
        },
        {
          name: 'r/SideProject',
          sub: 'SideProject',
          matchReason: 'Welcoming community of 180k builders who love honest behind-the-scenes engineering posts.',
          recommendedFlair: 'Showcase',
          antiBanTips: 'Mention your tech stack in the title or first comment. Ask for peer feedback.',
          url: `${baseRedditUrl}SideProject/submit`,
        },
      ];

    case 'performance':
      return [
        {
          name: 'r/programming',
          sub: 'programming',
          matchReason: '5.8M technical readers who appreciate concrete before/after benchmark numbers.',
          recommendedFlair: 'Tech Discussion',
          antiBanTips: 'No marketing hype. Provide reproduction steps, profiler snapshots, or memory traces.',
          url: `${baseRedditUrl}programming/submit`,
        },
        {
          name: 'r/webdev',
          sub: 'webdev',
          matchReason: 'High engagement for latency optimization, caching, and streaming fixes.',
          recommendedFlair: 'Tips & Tutorials',
          antiBanTips: 'Highlight the practical takeaway in bullet points for quick mobile scanning.',
          url: `${baseRedditUrl}webdev/submit`,
        },
        {
          name: 'r/SideProject',
          sub: 'SideProject',
          matchReason: 'Show what your SaaS does and how you engineered it to run fast on low hosting costs.',
          recommendedFlair: 'Showcase',
          antiBanTips: 'Be transparent about server costs and resource constraints.',
          url: `${baseRedditUrl}SideProject/submit`,
        },
      ];

    case 'bug_war_story':
      return [
        {
          name: 'r/programming',
          sub: 'programming',
          matchReason: 'Classic post-mortem audience. Engineers love reading about strange edge cases.',
          recommendedFlair: 'Post-Mortem',
          antiBanTips: 'Write chronologically: Symptom -> False assumption -> The discovery -> The code fix.',
          url: `${baseRedditUrl}programming/submit`,
        },
        {
          name: 'r/SideProject',
          sub: 'SideProject',
          matchReason: 'Founders relate deeply to production bugs and stressful debugging sessions.',
          recommendedFlair: 'Story',
          antiBanTips: 'Keep the founder tone honest and vulnerable. Conclude with an open question.',
          url: `${baseRedditUrl}SideProject/submit`,
        },
        {
          name: 'r/webdev',
          sub: 'webdev',
          matchReason: 'Great for distributed systems, race conditions, and frontend/backend integration issues.',
          recommendedFlair: 'Discussion',
          antiBanTips: 'Include minimal reproducible code snippets showing the race condition.',
          url: `${baseRedditUrl}webdev/submit`,
        },
      ];

    case 'ui_ux':
      return [
        {
          name: 'r/SideProject',
          sub: 'SideProject',
          matchReason: 'UI redesigns and before/after comparisons regularly reach #1 on the subreddit.',
          recommendedFlair: 'Showcase',
          antiBanTips: 'Explain the conversion numbers: why the old UI caused drop-off and how the new UI helps.',
          url: `${baseRedditUrl}SideProject/submit`,
        },
        {
          name: 'r/webdev',
          sub: 'webdev',
          matchReason: 'Discuss component architecture, CSS polish, and UX interaction design.',
          recommendedFlair: 'Showoff Saturday',
          antiBanTips: 'Discuss React/CSS state management tradeoffs rather than just aesthetic screenshots.',
          url: `${baseRedditUrl}webdev/submit`,
        },
        {
          name: 'r/SaaS',
          sub: 'SaaS',
          matchReason: 'Micro-SaaS founders eager to learn onboarding optimization and user retention tricks.',
          recommendedFlair: 'Case Study',
          antiBanTips: 'Focus on user psychology and activation metrics.',
          url: `${baseRedditUrl}SaaS/submit`,
        },
      ];

    default:
      return [
        {
          name: 'r/SideProject',
          sub: 'SideProject',
          matchReason: 'Default home for indie builders sharing weekly progress and shipping updates.',
          recommendedFlair: 'Showcase',
          antiBanTips: 'Ask for feedback on specific features or UX tradeoffs. Engage in every comment.',
          url: `${baseRedditUrl}SideProject/submit`,
        },
        {
          name: 'r/SaaS',
          sub: 'SaaS',
          matchReason: 'Discussion on shipping speed, validation, and micro-SaaS tech stack.',
          recommendedFlair: 'Discussion',
          antiBanTips: 'Provide actionable lessons for other solo developers.',
          url: `${baseRedditUrl}SaaS/submit`,
        },
        {
          name: 'r/webdev',
          sub: 'webdev',
          matchReason: 'General web development discussion and technical architecture review.',
          recommendedFlair: 'Showoff Saturday',
          antiBanTips: 'Frame the post around technical decisions rather than product sales.',
          url: `${baseRedditUrl}webdev/submit`,
        },
      ];
  }
}

/**
 * Compiles multiple selected commits into a cohesive Weekly Founder Digest.
 */
export function generateWeeklyDigest(
  events: GitEvent[],
  settings: EngineSettings
): WeeklyDigest {
  const prod = settings.productName || 'TCT PostPulse';
  const totalCommits = events.length;
  const totalAdditions = events.reduce((acc, e) => acc + (e.stats.additions || 0), 0);
  const totalDeletions = events.reduce((acc, e) => acc + (e.stats.deletions || 0), 0);
  const totalFiles = events.reduce((acc, e) => acc + (e.stats.totalFiles || 0), 0);

  // Group events by category
  const features = events.filter((e) => ['new_feature', 'ui_ux'].includes(e.worthiness.category));
  const performance = events.filter((e) => ['performance', 'database_migration'].includes(e.worthiness.category));
  const fixes = events.filter((e) => ['bug_war_story', 'security_auth'].includes(e.worthiness.category));
  const others = events.filter((e) => !features.includes(e) && !performance.includes(e) && !fixes.includes(e));

  // 1. Release Notes format
  let releaseNotes = `# ${prod} — Sprint Release Notes\n\n`;
  releaseNotes += `**Summary**: Shipped ${totalCommits} commits (+${totalAdditions} / -${totalDeletions} lines across ${totalFiles} files touched).\n\n`;

  if (features.length > 0) {
    releaseNotes += `### 🚀 New Features & UX Polish\n`;
    for (const f of features) {
      releaseNotes += `- **${f.title}**: ${f.description || 'Enhanced customer workflow and interface speed.'}\n`;
    }
    releaseNotes += `\n`;
  }

  if (performance.length > 0) {
    releaseNotes += `### ⚡ Performance & Reliability\n`;
    for (const p of performance) {
      releaseNotes += `- **${p.title}**: Slashed latency and optimized database queries.\n`;
    }
    releaseNotes += `\n`;
  }

  if (fixes.length > 0) {
    releaseNotes += `### 🛠️ Bug Fixes & Security\n`;
    for (const fx of fixes) {
      releaseNotes += `- **${fx.title}**: Hardened system boundaries and resolved edge-case race conditions.\n`;
    }
    releaseNotes += `\n`;
  }

  if (others.length > 0) {
    releaseNotes += `### 🔧 Architecture & Maintenance\n`;
    for (const o of others) {
      releaseNotes += `- **${o.title}**\n`;
    }
    releaseNotes += `\n`;
  }

  // 2. Founder Newsletter format (Indie Hackers / Substack)
  let newsletter = `# Shipped This Week: Building ${prod} in Public (Week Recap)\n\n`;
  newsletter += `Another week in the trenches building **${prod}**. Here is the raw recap of what we actually shipped, what broke, and what we learned.\n\n`;
  newsletter += `### 📊 Weekly Shipping Scorecard\n`;
  newsletter += `- **Commits Pushed**: ${totalCommits}\n`;
  newsletter += `- **Line Churn**: +${totalAdditions} / -${totalDeletions} lines\n`;
  newsletter += `- **Files Touched**: ${totalFiles}\n\n`;

  newsletter += `### 🛠️ Key Highlights & Founder Struggles\n`;
  const topEvents = [...events].sort((a, b) => b.worthiness.score - a.worthiness.score).slice(0, 3);
  for (const te of topEvents) {
    newsletter += `#### ${te.title}\n`;
    newsletter += `${te.description || 'A critical update resolving user bottlenecks and streamlining core platform workflows.'}\n`;
    newsletter += `*Key Takeaway*: Solving this in commit \`${te.shortSha}\` proved that investing in foundational reliability always beats rushing half-baked features.\n\n`;
  }

  newsletter += `### 💡 Founder Reflection of the Week\n`;
  newsletter += `Building as a solo founder is a balance between shipping user-visible polish and maintaining the backend engine. This week, we focused heavily on removing cognitive friction for users and ensuring rock-solid stability.\n\n`;
  newsletter += `**Question for fellow builders**: How do you decide when to stop optimizing an existing system versus moving on to the next feature on your roadmap? Let's discuss in the comments below! 👇\n`;

  // 3. Reddit Developer Roundup (r/SideProject, r/webdev)
  let redditRecap = `**Weekly Devlog: What we shipped to ${prod} this week (+${totalAdditions}/-${totalDeletions} lines)**\n\n`;
  redditRecap += `Hey r/SideProject! Quick weekly build-in-public update on what we pushed to production this week.\n\n`;
  redditRecap += `**The Highlights:**\n`;
  for (const ev of events.slice(0, 5)) {
    redditRecap += `- **${ev.title}** (\`${ev.shortSha}\`): ${ev.description || 'Optimized performance and refined user experience.'}\n`;
  }
  redditRecap += `\n**What broke & what we learned:**\n`;
  redditRecap += `The hardest commit this week was dealing with edge cases in production. Every time you think an edge case is "rare", real users will trigger it within 48 hours.\n\n`;
  redditRecap += `Would love feedback on our architecture or release cycle. How do you handle continuous deployment in your side projects?`;

  return {
    newsletter,
    releaseNotes,
    redditRecap,
    commitCount: totalCommits,
    eventIds: events.map((e) => e.id),
    generatedAt: new Date().toISOString(),
  };
}

