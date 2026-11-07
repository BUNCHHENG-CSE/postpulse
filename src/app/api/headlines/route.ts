import { NextRequest, NextResponse } from 'next/server';
import { getEventById, getSettings } from '@/lib/storage';
import { generateHeadlineVariations } from '@/lib/generator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId query parameter is required' }, { status: 400 });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const settings = await getSettings();
    const headlines = generateHeadlineVariations(event, settings);

    return NextResponse.json({ success: true, headlines });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
