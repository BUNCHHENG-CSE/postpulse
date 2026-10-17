import { NextRequest, NextResponse } from 'next/server';
import { getDrafts, updateDraft } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const drafts = await getDrafts();
    const draft = drafts.find((d) => d.id === id);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    return NextResponse.json({ draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDraft(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, draft: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
