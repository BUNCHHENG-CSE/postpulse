import { CommitCategory, DraftFormat, GitEvent, ToneStyle } from '@/types';

export interface PromptContext {
  event: GitEvent;
  format: DraftFormat;
  tone: ToneStyle;
  productName: string;
  productTagline: string;
  founderVoiceBio: string;
}

export function buildSystemPrompt(format: DraftFormat, category: CommitCategory, tone: ToneStyle): string {
  const baseAntiPatterns = `
CRITICAL VOICE GUIDELINES (FAILURE TO FOLLOW WILL BE REJECTED BY DEVELOPERS):
- DO NOT use LinkedIn-influencer hype phrases: "Thrilled to announce", "Excited to share", "In today's fast-paced digital world", "Game changer", "Revolutionize", "Super pumped".
- DO NOT use excessive emojis (max 1-2 functional icons or none).
- DO NOT sound like a corporate press release or an automated git log.
- DO sound like an experienced developer who just closed their terminal after a long debugging session and is talking to peers at a local meetup.
- Be specific: mention concrete concepts from the git diff (e.g. index types, SQL queries, memory allocation, hook re-renders, retry backoffs, HTTP status codes).
- Be honest about what broke, what was tricky, or what trade-off was made.
`;

  if (format === 'technical_lesson') {
    return `You are a senior software engineer and indie hacker writing a technical post for Reddit (r/SideProject, r/webdev, r/programming) or Dev.to.
${baseAntiPatterns}

CATEGORY FOCUS: ${category.toUpperCase()}
${getCategorySpecificGuidance(category)}

POST STRUCTURE:
1. Title: Informative, honest, intriguing. (e.g. "Why our Postgres pool exhausted under 150 concurrent users (and the migration that fixed it)")
2. Context: Briefly explain the setup and what you were building.
3. The Incident / Mistake: What went wrong or what bottleneck emerged? Include symptoms (e.g. timeout, memory spike, slow query).
4. The Fix: Explain the technical solution with a clean, concise code snippet or architectural diff concept.
5. What We Learned / Trade-offs: 2-3 blunt, practical takeaways for other engineers before they hit this wall.
6. Open Discussion: A genuine technical question for the community (e.g., "How do you handle zero-downtime index creation with large tables?").

Format in clean Markdown with code blocks.`;
  }

  if (format === 'build_in_public') {
    return `You are a solo indie hacker building a SaaS product in public, writing for Indie Hackers, LinkedIn, and X/Twitter.
${baseAntiPatterns}

CATEGORY FOCUS: ${category.toUpperCase()}
${getCategorySpecificGuidance(category)}

POST STRUCTURE:
1. Hook: 1-2 punchy lines capturing the friction or reality of shipping this update.
2. The Founder Reality: Why this mattered to users, why you postponed it, or why it took 4x longer than expected.
3. The Turning Point: What you learned while writing the code or fixing the edge case.
4. The Result: How the app feels now, or what metric/workflow improved.
5. Takeaway & Community Ask: A question inviting fellow builders to share their approach.

Format with comfortable whitespace for social reading.`;
  }

  // Changelog
  return `You are a product-focused technical writer creating a crisp, user-benefit changelog entry.
${baseAntiPatterns}

GOAL: Translate technical code changes and git commits into clear, punchy, benefit-driven release notes that non-engineers and power users understand immediately.

RULES:
- 1-3 bullet points max.
- Start with a clear category badge: [Speed], [Fixed], [New], or [Security].
- Explain the user benefit FIRST, followed by concise technical context if relevant.
- Example: "⚡ **4x Faster Dashboard**: Reports now stream in under 120ms (down from 850ms) even for accounts with 50k+ records."
- Never write: "Refactored db query chunks in handler.ts". Always focus on user outcome.`;
}

function getCategorySpecificGuidance(category: CommitCategory): string {
  switch (category) {
    case 'database_migration':
      return `Key themes: Lock contention, table locks, zero-downtime migrations, foreign keys, index selection, connection pools, schema evolution. Mention specific query/schema nuances.`;
    case 'performance':
      return `Key themes: Latency profiling, flamegraphs, memory leaks, unneeded re-renders, caching layers (Redis/in-memory), batching, N+1 queries. Include before vs after metrics where applicable.`;
    case 'bug_war_story':
      return `Key themes: The bizarre edge case, the red herring, how it bypassed test suites, the 2 AM realization, the subtle bug (concurrency, race conditions, timezone, floating point, unhandled promise).`;
    case 'ui_ux':
      return `Key themes: User friction, cognitive load, accessibility, layout shifts, dark mode contrast, modal traps, keyboard navigation, simplifying onboarding.`;
    case 'security_auth':
      return `Key themes: Webhook signature verification, CSRF, token expiry, session hydration, replay attacks, payment idempotency keys, rate-limiting edge cases.`;
    case 'new_feature':
      return `Key themes: Solving a real customer pain point, keeping scope minimal, why existing solutions fell short, balancing velocity vs technical debt.`;
    default:
      return `Key themes: Code hygiene, maintainability, developer ergonomics, test coverage.`;
  }
}

export function buildUserPrompt(ctx: PromptContext): string {
  const { event, format, tone, productName, productTagline, founderVoiceBio } = ctx;

  const fileSummary = event.files
    .slice(0, 8)
    .map((f) => `- ${f.status.toUpperCase()}: ${f.filename} (+${f.additions}/-${f.deletions})`)
    .join('\n');

  const diffSnippet = event.rawDiffSnippet
    ? `\nREPRESENTATIVE CODE DIFF / SNIPPET:\n\`\`\`\n${event.rawDiffSnippet.slice(0, 1500)}\n\`\`\``
    : '';

  return `
PROJECT INFO:
- Product: ${productName || 'SaaS App'}
- Tagline: ${productTagline || 'Developer tool'}
- Founder Profile / Voice: ${founderVoiceBio || 'Solo founder, ex-backend engineer'}

GIT EVENT DETAILS:
- Event Type: ${event.type}
- Repository: ${event.repo}
- Commit SHA: ${event.shortSha}
- Title: ${event.title}
- Extended Message: ${event.description || 'None provided'}
- Churn Stats: +${event.stats.additions} lines, -${event.stats.deletions} lines across ${event.stats.totalFiles} files
- Category Detected: ${event.worthiness.category} (Worthiness Score: ${event.worthiness.score}/100)
- Reasons: ${event.worthiness.reasons.join(', ')}

FILES MODIFIED:
${fileSummary}
${diffSnippet}

TARGET FORMAT: ${format}
DESIRED TONE: ${tone}

Please produce a high-converting, authentic draft that developers would actually upvote or engage with. Return ONLY the markdown content for the post.`;
}
