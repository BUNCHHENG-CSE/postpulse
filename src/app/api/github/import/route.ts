import { NextRequest, NextResponse } from 'next/server';
import { fetchCommitsFromRepo } from '@/lib/github';
import { getSettings, saveEvent } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json({ error: 'GitHub repository URL or owner/repo is required' }, { status: 400 });
    }

    const settings = await getSettings();
    const commits = await fetchCommitsFromRepo(repoUrl, settings.githubToken);

    for (const commit of commits) {
      await saveEvent(commit);
    }

    return NextResponse.json({
      success: true,
      importedCount: commits.length,
      commits,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: err.message || 'Failed to import commits' }, { status: 500 });
  }
}
