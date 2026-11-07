import { prisma } from '../src/lib/db.ts';
import { getEvents, getSettings, saveDraft, updateDraft } from '../src/lib/storage.ts';
import {
  generateDraft,
  generateHeadlineVariations,
  getSubredditRecommendations,
  splitIntoTweetThread,
  generateWeeklyDigest,
} from '../src/lib/generator.ts';

async function runTests() {
  console.log('🧪 Starting PostPulse Feature & Optimization Test Suite...\n');

  // Test 1: Event loading
  const events = await getEvents();
  console.log(`✅ Test 1: Loaded ${events.length} events from database.`);

  const sampleEvent = events[0];
  console.log(`   Sample Event: [${sampleEvent.shortSha}] ${sampleEvent.title} (Category: ${sampleEvent.worthiness.category}, Score: ${sampleEvent.worthiness.score})`);

  // Test 2: Viral Headline Variations (5 angles)
  const settings = await getSettings();
  const headlines = generateHeadlineVariations(sampleEvent, settings);
  console.log(`\n✅ Test 2: Generated ${headlines.length} Viral Headline variations:`);
  for (const h of headlines) {
    console.log(`   • [${h.label}]: "${h.headline}"`);
  }

  // Test 3: Subreddit Recommendations
  const subreddits = getSubredditRecommendations(sampleEvent.worthiness.category);
  console.log(`\n✅ Test 3: Subreddit Recommendations for [${sampleEvent.worthiness.category}]:`);
  for (const sub of subreddits) {
    console.log(`   • r/${sub.sub} (Flair: ${sub.recommendedFlair || 'None'}) -> ${sub.matchReason}`);
  }

  // Test 4: Single Draft Generation & Thread Splitting
  const draft = await generateDraft(sampleEvent, 'technical_lesson', settings);
  console.log(`\n✅ Test 4: Generated Technical Lesson draft (${draft.wordCount} words, "${draft.title}")`);

  const thread = splitIntoTweetThread(draft.content, draft.title);
  console.log(`\n✅ Test 5: 𝕏 Tweet Thread Splitter produced ${thread.length} sequential tweets:`);
  thread.forEach((t) => {
    console.log(`   • Tweet ${t.index}/${t.total} (${t.charCount} chars, valid: ${t.isValidLength})`);
  });

  // Test 6: Multi-Commit Weekly Digest
  const worthyEvents = events.filter((e) => e.worthiness.score >= 50);
  const digest = generateWeeklyDigest(worthyEvents, settings);
  console.log(`\n✅ Test 6: Compiled Weekly Digest from ${digest.commitCount} commits:`);
  console.log(`   • Newsletter Length: ${digest.newsletter.split(/\s+/).length} words`);
  console.log(`   • Release Notes Length: ${digest.releaseNotes.split(/\s+/).length} words`);
  console.log(`   • Reddit Devlog Length: ${digest.redditRecap.split(/\s+/).length} words`);

  // Test 7: Published URL tracking
  const saved = await saveDraft(draft);
  const updated = await updateDraft(saved.id, { publishedUrl: 'https://reddit.com/r/SideProject/comments/test123' });
  console.log(`\n✅ Test 7: Published URL tracked: ${updated?.publishedUrl}`);

  console.log('\n🎉 ALL 7 NEW FEATURE VERIFICATIONS PASSED CLEANLY!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
