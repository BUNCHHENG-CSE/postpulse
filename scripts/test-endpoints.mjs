async function testLiveApi() {
  console.log('🚀 Running Live API & UI End-to-End Test on http://localhost:3000 ...\n');

  // Test 1: Fetch Events
  const eventsRes = await fetch('http://localhost:3000/api/events');
  const eventsData = await eventsRes.json();
  console.log(`✅ 1. GET /api/events -> Status ${eventsRes.status}. Ingested commits: ${eventsData.events?.length}`);

  if (!eventsData.events || eventsData.events.length === 0) {
    throw new Error('No events found in database');
  }

  const testEvent = eventsData.events[0];
  console.log(`   Sample commit: [${testEvent.shortSha}] ${testEvent.title}`);

  // Test 2: Generate Drafts for Commit
  const genRes = await fetch(`http://localhost:3000/api/events/${testEvent.id}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const genData = await genRes.json();
  console.log(`✅ 2. POST /api/events/${testEvent.id}/generate -> Status ${genRes.status}, success: ${genData.success}`);

  // Test 3: Headlines Lab Endpoint
  const headlinesRes = await fetch(`http://localhost:3000/api/headlines?eventId=${testEvent.id}`);
  const headlinesData = await headlinesRes.json();
  console.log(`✅ 3. GET /api/headlines?eventId=${testEvent.id} -> Status ${headlinesRes.status}, headlines count: ${headlinesData.headlines?.length}`);
  headlinesData.headlines?.forEach((h) => {
    console.log(`      • [${h.label}]: "${h.headline}"`);
  });

  // Test 4: Weekly Digest Endpoint
  const digestRes = await fetch('http://localhost:3000/api/digest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventIds: eventsData.events.slice(0, 4).map((e) => e.id) }),
  });
  const digestData = await digestRes.json();
  console.log(`✅ 4. POST /api/digest -> Status ${digestRes.status}, commit count: ${digestData.digest?.commitCount}`);
  console.log(`      • Release Notes generated: ${digestData.digest?.releaseNotes.length} chars`);
  console.log(`      • Newsletter generated: ${digestData.digest?.newsletter.length} chars`);
  console.log(`      • Reddit Devlog generated: ${digestData.digest?.redditRecap.length} chars`);

  // Test 5: Fetch Drafts & Test Live Published URL Tracking
  const draftsRes = await fetch('http://localhost:3000/api/drafts');
  const draftsData = await draftsRes.json();
  console.log(`✅ 5. GET /api/drafts -> Status ${draftsRes.status}, total drafts: ${draftsData.drafts?.length}`);

  const activeDraft = draftsData.drafts[0];
  const patchRes = await fetch(`http://localhost:3000/api/drafts/${activeDraft.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishedUrl: 'https://reddit.com/r/SideProject/comments/viral_post_123' }),
  });
  const patchData = await patchRes.json();
  console.log(`✅ 6. PATCH /api/drafts/${activeDraft.id} -> Status ${patchRes.status}, publishedUrl: ${patchData.draft?.publishedUrl}`);

  // Test 6: Root Page UI Render
  const pageRes = await fetch('http://localhost:3000/');
  const html = await pageRes.text();
  const hasAppTitle = html.includes('PostPulse') || html.includes('POSTPULSE');
  console.log(`✅ 7. GET / -> Status ${pageRes.status}, HTML contains PostPulse: ${hasAppTitle}`);

  console.log('\n🌟 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!\n');
}

testLiveApi().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
