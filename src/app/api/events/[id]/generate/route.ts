import { NextRequest, NextResponse } from 'next/server';
import { getEventById, getSettings, saveDraft, updateEventStatus } from '@/lib/storage';
import { generateDraft } from '@/lib/generator';
import { DraftFormat, ToneStyle } from '@/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { format, tone } = body as { format?: DraftFormat; tone?: ToneStyle };

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const settings = await getSettings();

    // If specific format requested, generate only that format
    if (format) {
      const draft = await generateDraft(event, format, settings, tone);
      await saveDraft(draft);
      await updateEventStatus(id, 'drafted');
      return NextResponse.json({ success: true, draft });
    }

    // Otherwise generate all three core drafts
    const [technicalLesson, buildInPublic, changelog] = await Promise.all([
      generateDraft(event, 'technical_lesson', settings, tone),
      generateDraft(event, 'build_in_public', settings, tone),
      generateDraft(event, 'changelog', settings, tone),
    ]);

    await saveDraft(technicalLesson);
    await saveDraft(buildInPublic);
    await saveDraft(changelog);
    await updateEventStatus(id, 'drafted');

    return NextResponse.json({
      success: true,
      drafts: {
        technicalLesson,
        buildInPublic,
        changelog,
      },
    });
  } catch (err: any) {
    console.error('Generation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
