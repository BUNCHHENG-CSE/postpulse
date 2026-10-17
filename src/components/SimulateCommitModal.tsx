'use client';

import React, { useState } from 'react';
import { X, Sparkles, Terminal, ArrowRight } from 'lucide-react';

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
      label: 'Postgres Lock & Partial Index',
      title: 'perf(db): add partial index on accounts(org_id) to eliminate table locks during cascade updates',
      desc: 'Table locks were causing 504 timeouts when concurrent transactions tried updating account metadata.',
      files: 'prisma/migrations/20261017_idx.sql, src/server/queries.ts',
      add: 35,
      del: 8,
    },
    {
      label: 'Stripe Webhook Replay Protection',
      title: 'fix(billing): add nonce cache and timestamp tolerance to stripe webhook handler',
      desc: 'Discovered duplicate events were getting processed twice when customers had flaky internet during checkout.',
      files: 'src/app/api/webhooks/stripe/route.ts, src/lib/redis.ts',
      add: 62,
      del: 18,
    },
    {
      label: 'UI Modal to Split Editor',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-2">
          <Terminal className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-100">Simulate Git Event</h3>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Test the noise filter, post-worthiness classifier, and draft generation engine on any custom commit or diff.
        </p>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2">
            One-Click Realistic Presets:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all text-xs"
              >
                <div className="font-semibold text-slate-200 truncate">{p.label}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">+{p.add} / -{p.del} lines</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Commit Message / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. perf(db): optimize slow query with composite index"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Extended Commit Body / PR Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on what broke, why this was tricky, or before/after benchmarks..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Files Changed (comma separated)
            </label>
            <input
              type="text"
              value={filenames}
              onChange={(e) => setFilenames(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lines Added</label>
              <input
                type="number"
                value={additions}
                onChange={(e) => setAdditions(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lines Deleted</label>
              <input
                type="number"
                value={deletions}
                onChange={(e) => setDeletions(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-rose-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Repository</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting...' : 'Ingest & Classify Commit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
