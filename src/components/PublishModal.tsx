'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ContentDraft, GitEvent, SubredditRecommendation } from '@/types';
import {
  Share2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Globe,
  Radio,
  CheckCircle2,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GithubIcon } from '@/components/Icons';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: ContentDraft;
  event: GitEvent;
  recommendedSubreddits: SubredditRecommendation[];
  onMarkPublished: (url: string) => Promise<void>;
}

export function PublishModal({
  isOpen,
  onClose,
  draft,
  event,
  recommendedSubreddits,
  onMarkPublished,
}: PublishModalProps) {
  const [selectedSubreddit, setSelectedSubreddit] = useState(
    recommendedSubreddits[0]?.sub || 'SideProject'
  );
  const [publishedLinkInput, setPublishedLinkInput] = useState(draft.publishedUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Intent URLs
  const redditSubmitUrl = `https://www.reddit.com/r/${selectedSubreddit}/submit?title=${encodeURIComponent(
    draft.title
  )}&text=${encodeURIComponent(draft.content)}`;

  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${draft.title}\n\n${draft.hook || ''}\n\n#buildinpublic #indiehackers`
  )}`;

  const linkedInShareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
    `${draft.title}\n\n${draft.content}`
  )}`;

  const handleDownloadMarkdown = () => {
    const frontmatter = `---
title: "${draft.title.replace(/"/g, '\\"')}"
date: "${new Date().toISOString()}"
commit: "${event.shortSha}"
repo: "${event.repo}"
format: "${draft.format}"
platform: "${draft.targetPlatform}"
category: "${event.worthiness.category}"
---

${draft.content}
`;
    const blob = new Blob([frontmatter], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postpulse-${event.shortSha}-${draft.format}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePublished = async () => {
    if (!publishedLinkInput.trim()) return;
    setIsSaving(true);
    await onMarkPublished(publishedLinkInput.trim());
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-mono">
                1-Click Publisher & Share Hub
              </DialogTitle>
              <DialogDescription className="text-xs">
                Launch pre-formatted posts into developer communities or record live publication links.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Post Summary Preview Box */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Commit [{event.shortSha}] • {draft.platformName}</span>
              <span>{draft.wordCount} words</span>
            </div>
            <p className="text-xs font-bold text-foreground line-clamp-1">
              {draft.title}
            </p>
          </div>

          {/* SECTION 1: 1-CLICK LAUNCHERS */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase font-bold text-foreground tracking-wider flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Direct 1-Click Launchers</span>
            </h4>

            {/* Reddit Launcher */}
            <div className="p-3 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center font-bold text-[10px] text-white">
                    r/
                  </span>
                  <span className="font-bold text-xs text-foreground">Post to Reddit</span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[11px] text-muted-foreground">Target:</span>
                  <select
                    value={selectedSubreddit}
                    onChange={(e) => setSelectedSubreddit(e.target.value)}
                    className="bg-card border border-border rounded px-2 py-0.5 text-xs font-mono font-medium focus:outline-none"
                  >
                    {recommendedSubreddits.map((sub) => (
                      <option key={sub.sub} value={sub.sub}>
                        r/{sub.sub}
                      </option>
                    ))}
                    <option value="SideProject">r/SideProject</option>
                    <option value="webdev">r/webdev</option>
                    <option value="programming">r/programming</option>
                    <option value="SaaS">r/SaaS</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  Pre-fills title, markdown body & flair requirements.
                </span>
                <a
                  href={redditSubmitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                >
                  <span>Open Reddit Composer</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Other Platform Launchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* X / Twitter */}
              <a
                href={twitterIntentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-mono text-foreground">𝕏 / Twitter</span>
                </div>
                <span className="text-primary font-semibold flex items-center space-x-1">
                  <span>Tweet</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-mono text-foreground">LinkedIn</span>
                </div>
                <span className="text-primary font-semibold flex items-center space-x-1">
                  <span>Share</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </a>
            </div>

            {/* Download Markdown (.md) */}
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMarkdown}
                className="w-full text-xs font-semibold gap-2 border-border"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Download as Clean Markdown File (.md)</span>
              </Button>
            </div>
          </div>

          {/* SECTION 2: MARK AS PUBLISHED */}
          <div className="pt-3 border-t border-border space-y-2">
            <h4 className="text-xs font-mono uppercase font-bold text-foreground tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Track Live Post Status</span>
            </h4>

            <p className="text-[11px] text-muted-foreground">
              Paste the public URL after publishing (Reddit thread or Tweet link) to mark this commit as published and track historical reach.
            </p>

            <div className="flex items-center space-x-2">
              <Input
                value={publishedLinkInput}
                onChange={(e) => setPublishedLinkInput(e.target.value)}
                placeholder="https://reddit.com/r/SideProject/comments/..."
                className="text-xs font-mono flex-1"
              />
              <Button
                size="sm"
                onClick={handleSavePublished}
                disabled={isSaving || !publishedLinkInput.trim()}
                className="text-xs font-bold shrink-0"
              >
                {isSaving ? 'Saving...' : 'Mark Published'}
              </Button>
            </div>

            {draft.publishedUrl && (
              <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300">
                <span className="truncate mr-2 font-mono">Live: {draft.publishedUrl}</span>
                <a
                  href={draft.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold flex items-center space-x-1 shrink-0 hover:underline"
                >
                  <span>Visit Post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
