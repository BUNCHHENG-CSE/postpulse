import { NextRequest, NextResponse } from 'next/server';
import { getEvents, saveEvent } from '@/lib/storage';
import { classifyGitEvent } from '@/lib/classifier';
import { GitEvent } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const minScore = searchParams.get('minScore');
    const status = searchParams.get('status');

    let events = await getEvents();

    if (category && category !== 'all') {
      events = events.filter((e) => e.worthiness.category === category);
    }

    if (minScore) {
      const scoreNum = parseInt(minScore, 10);
      events = events.filter((e) => e.worthiness.score >= scoreNum);
    }

    if (status && status !== 'all') {
      events = events.filter((e) => e.status === status);
    }

    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, files = [], additions = 50, deletions = 10, repo = 'my-project/main' } = body;

    if (!title) {
      return NextResponse.json({ error: 'Commit title is required' }, { status: 400 });
    }

    const fileList = files.length > 0 ? files : [
      { filename: 'src/core/feature.ts', status: 'modified' as const, additions, deletions }
    ];

    const stats = {
      additions: Number(additions),
      deletions: Number(deletions),
      totalFiles: fileList.length,
    };

    const worthiness = classifyGitEvent({
      title,
      description,
      files: fileList,
      stats,
    });

    const sha = Math.random().toString(16).substring(2, 16);
    const newEvent: GitEvent = {
      id: `evt_custom_${Date.now()}`,
      type: 'commit',
      repo,
      branch: 'main',
      author: {
        name: 'You (Developer)',
        username: 'founder',
      },
      timestamp: new Date().toISOString(),
      title,
      description,
      sha,
      shortSha: sha.substring(0, 7),
      url: `https://github.com/${repo}/commit/${sha}`,
      stats,
      files: fileList,
      rawDiffSnippet: body.rawDiffSnippet || undefined,
      worthiness,
      status: 'pending',
    };

    const saved = await saveEvent(newEvent);
    return NextResponse.json({ success: true, event: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
