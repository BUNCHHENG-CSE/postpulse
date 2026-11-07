'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WeeklyDigest, GitEvent } from '@/types';
import {
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  Share2,
  Calendar,
  Layers,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WeeklyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  digest: WeeklyDigest | null;
  events: GitEvent[];
  onNotify: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export function WeeklyDigestModal({
  isOpen,
  onClose,
  digest,
  events,
  onNotify,
}: WeeklyDigestModalProps) {
  const [activeTab, setActiveTab] = useState<'newsletter' | 'releaseNotes' | 'redditRecap'>('newsletter');
  const [copied, setCopied] = useState(false);

  if (!digest) return null;

  const currentContent = digest[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      onNotify('success', 'Copied to Clipboard', `Weekly digest (${activeTab}) copied successfully.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const filename = `postpulse-weekly-digest-${activeTab}-${new Date().toISOString().slice(0, 10)}.md`;
    const blob = new Blob([currentContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('success', 'Downloaded File', `${filename} saved.`);
  };

  const wordCount = currentContent.split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary to-cyan-400 text-white shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold font-mono">
                  Weekly Founder Digest & Release Roundup
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Synthesized from {digest.commitCount} selected commits across your development sprint.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </Button>

              <Button
                size="sm"
                onClick={handleCopy}
                className="text-xs font-semibold gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Digest'}</span>
              </Button>
            </div>
          </div>

          {/* Format Selector Pills */}
          <div className="mt-4 flex items-center space-x-2 border-t border-border pt-3">
            <button
              onClick={() => setActiveTab('newsletter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'newsletter'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Founder Newsletter (Substack / IH)
            </button>
            <button
              onClick={() => setActiveTab('releaseNotes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'releaseNotes'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Sprint Release Notes (Changelog)
            </button>
            <button
              onClick={() => setActiveTab('redditRecap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'redditRecap'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Reddit Devlog (r/SideProject)
            </button>
          </div>
        </div>

        {/* Content Preview Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
            <span className="font-mono">Word Count: {wordCount} words</span>
            <span className="font-mono">{digest.commitCount} commits included</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <MarkdownRenderer content={currentContent} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Ready to publish directly to Substack, Indie Hackers, or customer release modals.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
