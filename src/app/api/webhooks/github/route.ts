import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubWebhookPayload, verifyGitHubSignature } from '@/lib/github';
import { generateDraft } from '@/lib/generator';
import { getSettings, saveDraft, saveEvent } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const githubEvent = req.headers.get('x-github-event') || 'push';

    const settings = await getSettings();

    // Verify signature if secret configured
    if (settings.githubWebhookSecret) {
      const isValid = verifyGitHubSignature(rawBody, signature, settings.githubWebhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const events = parseGitHubWebhookPayload(githubEvent, payload);

    const results = [];
    for (const evt of events) {
      await saveEvent(evt);

      // Auto-generate if enabled and meets score threshold
      if (settings.autoDraftOnWebhook && evt.worthiness.score >= settings.minScoreToDraft) {
        const technical = await generateDraft(evt, 'technical_lesson', settings);
        const bip = await generateDraft(evt, 'build_in_public', settings);
        const changelog = await generateDraft(evt, 'changelog', settings);

        await saveDraft(technical);
        await saveDraft(bip);
        await saveDraft(changelog);

        results.push({
          eventId: evt.id,
          title: evt.title,
          draftsGenerated: 3,
        });
      } else {
        results.push({
          eventId: evt.id,
          title: evt.title,
          draftsGenerated: 0,
          reason: 'Score below threshold or auto-draft disabled',
        });
      }
    }

    return NextResponse.json({ success: true, processedEvents: results.length, events: results });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
