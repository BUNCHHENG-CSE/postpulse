import { NextRequest, NextResponse } from 'next/server';
import { getEvents, getSettings } from '@/lib/storage';
import { generateWeeklyDigest } from '@/lib/generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { eventIds } = body as { eventIds?: string[] };

    const allEvents = await getEvents();
    const settings = await getSettings();

    let targetEvents = allEvents;
    if (eventIds && eventIds.length > 0) {
      targetEvents = allEvents.filter((e) => eventIds.includes(e.id));
    }

    if (targetEvents.length === 0) {
      return NextResponse.json(
        { error: 'No matching commits found to compile digest.' },
        { status: 400 }
      );
    }

    const digest = generateWeeklyDigest(targetEvents, settings);
    return NextResponse.json({ success: true, digest });
  } catch (err: any) {
    console.error('Digest generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
