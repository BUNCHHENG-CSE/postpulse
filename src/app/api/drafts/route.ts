import { NextRequest, NextResponse } from 'next/server';
import { getDrafts, saveDraft } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const format = searchParams.get('format');

    let drafts = await getDrafts();

    if (eventId) {
      drafts = drafts.filter((d) => d.eventId === eventId);
    }
    if (format) {
      drafts = drafts.filter((d) => d.format === format);
    }

    return NextResponse.json({ drafts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await saveDraft(body);
    return NextResponse.json({ success: true, draft: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
