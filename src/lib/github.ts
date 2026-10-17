import crypto from 'crypto';
import { GitEvent } from '@/types';
import { classifyGitEvent } from './classifier';

export function verifyGitHubSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!secret) return true; // If no secret configured, bypass
  if (!signatureHeader) return false;

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') return false;

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

export function parseGitHubWebhookPayload(eventHeader: string, body: any): GitEvent[] {
  const events: GitEvent[] = [];
  const repoName = body.repository?.full_name || 'unknown/repo';

  if (eventHeader === 'push') {
    const commits = body.commits || [];
    const branch = (body.ref || '').replace('refs/heads/', '');

    for (const c of commits) {
      const allFiles = [
        ...(c.added || []).map((f: string) => ({ filename: f, status: 'added' as const, additions: 10, deletions: 0 })),
        ...(c.modified || []).map((f: string) => ({ filename: f, status: 'modified' as const, additions: 5, deletions: 5 })),
        ...(c.removed || []).map((f: string) => ({ filename: f, status: 'removed' as const, additions: 0, deletions: 10 })),
      ];

      const stats = {
        additions: (c.added?.length || 0) * 15 + (c.modified?.length || 0) * 8,
        deletions: (c.removed?.length || 0) * 10 + (c.modified?.length || 0) * 4,
        totalFiles: allFiles.length || 1,
      };

      const title = (c.message || '').split('\n')[0];
      const description = (c.message || '').split('\n').slice(1).join('\n').trim();

      const worthiness = classifyGitEvent({
        title,
        description,
        files: allFiles,
        stats,
      });

      events.push({
        id: `gh_${c.id.substring(0, 10)}`,
        type: 'commit',
        repo: repoName,
        branch,
        author: {
          name: c.author?.name || 'Developer',
          username: c.author?.username || c.author?.name || 'dev',
        },
        timestamp: c.timestamp || new Date().toISOString(),
        title,
        description,
        sha: c.id,
        shortSha: c.id.substring(0, 7),
        url: c.url,
        stats,
        files: allFiles,
        worthiness,
        status: 'pending',
      });
    }
  } else if (eventHeader === 'release' && body.action === 'published') {
    const r = body.release;
    const stats = { additions: 150, deletions: 20, totalFiles: 10 };
    const title = `Release ${r.tag_name}: ${r.name || 'New Version'}`;
    const description = r.body || '';

    const worthiness = classifyGitEvent({
      title,
      description,
      files: [{ filename: 'CHANGELOG.md', status: 'modified', additions: 100, deletions: 0 }],
      stats,
    });

    events.push({
      id: `gh_rel_${r.id}`,
      type: 'release',
      repo: repoName,
      branch: 'main',
      author: {
        name: r.author?.login || 'Release Manager',
        username: r.author?.login || 'dev',
        avatarUrl: r.author?.avatar_url,
      },
      timestamp: r.published_at || new Date().toISOString(),
      title,
      description,
      sha: r.tag_name,
      shortSha: r.tag_name,
      url: r.html_url,
      stats,
      files: [{ filename: 'CHANGELOG.md', status: 'modified', additions: 100, deletions: 0 }],
      worthiness: {
        ...worthiness,
        score: Math.max(85, worthiness.score),
        category: 'new_feature',
      },
      status: 'pending',
    });
  }

  return events;
}

/**
 * Fetch commits directly from any public GitHub repository (e.g., vercel/next.js, facebook/react, or user's repo)
 */
export async function fetchCommitsFromRepo(
  repoFullName: string,
  githubToken?: string
): Promise<GitEvent[]> {
  const cleanRepo = repoFullName.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Build-In-Public-Engine',
  };

  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  const url = `https://api.github.com/repos/${cleanRepo}/commits?per_page=10`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`GitHub API returned status ${res.status}: ${errorBody}`);
  }

  const rawCommits = await res.json();
  const events: GitEvent[] = [];

  for (const c of rawCommits) {
    const messageLines = (c.commit?.message || '').split('\n');
    const title = messageLines[0] || 'Commit';
    const description = messageLines.slice(1).join('\n').trim();

    // Fetch individual commit for detailed file stats
    let files = [];
    let stats = { additions: 35, deletions: 10, totalFiles: 3 };
    let patchSnippet: string | undefined;

    try {
      const detailRes = await fetch(c.url, { headers });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        stats = {
          additions: detail.stats?.additions || 0,
          deletions: detail.stats?.deletions || 0,
          totalFiles: detail.files?.length || 1,
        };
        files = (detail.files || []).slice(0, 10).map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patchSnippet: f.patch?.slice(0, 300),
        }));
        patchSnippet = files[0]?.patchSnippet;
      }
    } catch {
      // Fallback to basic file placeholders
      files = [{ filename: 'src/index.ts', status: 'modified' as const, additions: 20, deletions: 5 }];
    }

    const worthiness = classifyGitEvent({
      title,
      description,
      files,
      stats,
    });

    events.push({
      id: `gh_${c.sha.substring(0, 10)}`,
      type: 'commit',
      repo: cleanRepo,
      branch: 'main',
      author: {
        name: c.commit?.author?.name || c.author?.login || 'Developer',
        username: c.author?.login || 'dev',
        avatarUrl: c.author?.avatar_url,
      },
      timestamp: c.commit?.author?.date || new Date().toISOString(),
      title,
      description,
      sha: c.sha,
      shortSha: c.sha.substring(0, 7),
      url: c.html_url,
      stats,
      files,
      rawDiffSnippet: patchSnippet,
      worthiness,
      status: 'pending',
    });
  }

  return events;
}
