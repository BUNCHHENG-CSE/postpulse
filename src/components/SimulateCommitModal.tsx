'use client';

import React, { useState } from 'react';
import { X, Sparkles, Terminal, Database, Palette, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface SimulateCommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commitData: {
    title: string;
    description: string;
    files: Array<{ filename: string; status: 'added' | 'modified' | 'removed'; additions: number; deletions: number }>;
    additions: number;
    deletions: number;
    repo: string;
  }) => Promise<void>;
}

export function SimulateCommitModal({ isOpen, onClose, onSubmit }: SimulateCommitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filenames, setFilenames] = useState('src/db/queries.ts, prisma/schema.prisma');
  const [additions, setAdditions] = useState(45);
  const [deletions, setDeletions] = useState(12);
  const [repo, setRepo] = useState('my-startup/app');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      label: 'Postgres Partial Index',
      icon: Database,
      title: 'perf(db): add partial index on accounts(org_id) to eliminate table locks during cascade updates',
      desc: 'Table locks were causing 504 timeouts when concurrent transactions tried updating account metadata.',
      files: 'prisma/migrations/20261017_idx.sql, src/server/queries.ts',
      add: 35,
      del: 8,
    },
    {
      label: 'Stripe Replay Protection',
      icon: Shield,
      title: 'fix(billing): add nonce cache and timestamp tolerance to stripe webhook handler',
      desc: 'Discovered duplicate events were getting processed twice when customers had flaky internet during checkout.',
      files: 'src/app/api/webhooks/stripe/route.ts, src/lib/redis.ts',
      add: 62,
      del: 18,
    },
    {
      label: 'Split-View Editor UX',
      icon: Palette,
      title: 'ui(composer): rip out 3-step modal wizard in favor of split-view editor',
      desc: 'Customer onboarding conversion jumped from 62% to 88% after removing the multi-step popup.',
      files: 'src/components/Composer.tsx, src/styles/editor.css',
      add: 140,
      del: 95,
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setTitle(p.title);
    setDescription(p.desc);
    setFilenames(p.files);
    setAdditions(p.add);
    setDeletions(p.del);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    const files = filenames
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((f) => ({
        filename: f,
        status: 'modified' as const,
        additions: Math.round(additions / (filenames.split(',').length || 1)),
        deletions: Math.round(deletions / (filenames.split(',').length || 1)),
      }));

    await onSubmit({
      title,
      description,
      files,
      additions: Number(additions),
      deletions: Number(deletions),
      repo,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <Card className="border-border rounded-xl max-w-xl w-full p-6 shadow-xl relative bg-card">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-primary mb-1.5">
          <Terminal className="w-5 h-5" />
          <h3 className="text-lg font-bold text-foreground tracking-tight">Simulate Custom Commit</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Test the noise filter, post-worthiness classifier, and draft generation engine on any custom commit or diff.
        </p>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-mono uppercase text-muted-foreground block mb-2 font-semibold">
            One-Click Realistic Presets:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-left p-2.5 rounded-lg bg-muted/40 border border-border hover:border-primary/50 hover:bg-muted transition-all text-xs group"
                >
                  <div className="flex items-center space-x-1.5 font-bold text-foreground group-hover:text-primary">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{p.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate mt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{p.add}</span> /{' '}
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">-{p.del}</span> lines
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Commit Message / Title *
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. perf(db): optimize slow query with composite index"
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Extended Commit Body / PR Description (Optional)
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on what broke, why this was tricky, or before/after benchmarks..."
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Files Changed (comma separated)
            </label>
            <Input
              value={filenames}
              onChange={(e) => setFilenames(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Lines Added</label>
              <Input
                type="number"
                value={additions}
                onChange={(e) => setAdditions(Number(e.target.value))}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Lines Deleted</label>
              <Input
                type="number"
                value={deletions}
                onChange={(e) => setDeletions(Number(e.target.value))}
                className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Repository</label>
              <Input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-bold gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting...' : 'Ingest & Classify Commit'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
