'use client';

import React, { useState } from 'react';
import { GitEvent } from '@/types';
import {
  GitCommit,
  Tag,
  FileCode,
  Flame,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface EventCardProps {
  event: GitEvent;
  onSelectForStudio: (event: GitEvent) => void;
  onGenerate: (eventId: string) => Promise<void>;
  onDismiss: (eventId: string) => Promise<void>;
  isGenerating?: boolean;
  draftsCount?: number;
}

export function EventCard({
  event,
  onSelectForStudio,
  onGenerate,
  onDismiss,
  isGenerating,
  draftsCount = 0,
}: EventCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    if (score >= 50) return 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30';
    return 'text-slate-400 bg-slate-900 border-slate-800';
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'database_migration':
        return { label: 'Database Migration', color: 'bg-purple-950/60 text-purple-300 border-purple-800' };
      case 'performance':
        return { label: 'Performance', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800' };
      case 'bug_war_story':
        return { label: 'Bug War Story', color: 'bg-rose-950/60 text-rose-300 border-rose-800' };
      case 'security_auth':
        return { label: 'Security & Auth', color: 'bg-amber-950/60 text-amber-300 border-amber-800' };
      case 'ui_ux':
        return { label: 'UI / UX Polish', color: 'bg-pink-950/60 text-pink-300 border-pink-800' };
      case 'new_feature':
        return { label: 'New Feature', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' };
      default:
        return { label: 'Internal Chore', color: 'bg-slate-900 text-slate-400 border-slate-800' };
    }
  };

  const catBadge = getCategoryBadge(event.worthiness.category);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        event.status === 'dismissed'
          ? 'bg-slate-950/40 border-slate-900 opacity-60'
          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 shadow-lg shadow-black/20'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Header: Category, SHA, Worthiness Score */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${catBadge.color}`}
            >
              {catBadge.label}
            </span>

            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 font-mono text-xs text-slate-400 hover:text-indigo-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80"
            >
              {event.type === 'release' ? (
                <Tag className="w-3 h-3 text-emerald-400" />
              ) : (
                <GitCommit className="w-3 h-3 text-slate-500" />
              )}
              <span>{event.shortSha}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <span className="text-xs text-slate-500">
              {new Date(event.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Worthiness Score Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getScoreColor(
              event.worthiness.score
            )}`}
            title={`Post-Worthiness Score: ${event.worthiness.score}/100`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{event.worthiness.score}</span>
            <span className="text-[10px] font-normal opacity-70">/ 100</span>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectForStudio(event)}
          className="text-base font-semibold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer tracking-tight mb-2"
        >
          {event.title}
        </h3>

        {/* Description snippet if any */}
        {event.description && (
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Stats line */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/50">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {event.stats.totalFiles} {event.stats.totalFiles === 1 ? 'file' : 'files'}
              </span>
            </span>
            <span className="text-emerald-400 font-mono">+{event.stats.additions}</span>
            <span className="text-rose-400 font-mono">-{event.stats.deletions}</span>
            <span className="text-slate-500 hidden sm:inline">by @{event.author.username}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 text-xs flex items-center space-x-1"
            >
              <span>{showDetails ? 'Hide analysis' : 'Why this score?'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {draftsCount > 0 ? (
              <button
                onClick={() => onSelectForStudio(event)}
                className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg font-medium shadow-sm transition-all"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>View {draftsCount} Drafts</span>
              </button>
            ) : (
              <button
                onClick={() => onGenerate(event.id)}
                disabled={isGenerating}
                className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isGenerating ? 'Generating...' : 'Generate 3 Drafts'}</span>
              </button>
            )}

            <button
              onClick={() => onDismiss(event.id)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800"
              title="Dismiss event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Analysis & Files */}
        {showDetails && (
          <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950/50 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-xl space-y-3">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Worthiness Scoring Breakdown:</span>
              </div>
              <ul className="space-y-1">
                {event.worthiness.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start space-x-2">
                    <span className="text-indigo-400">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {event.files.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">Key Files Touched:</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {event.files.slice(0, 5).map((f, i) => (
                    <div
                      key={i}
                      className="text-[11px] font-mono text-slate-400 flex items-center justify-between bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/60"
                    >
                      <span className="truncate max-w-[80%]">{f.filename}</span>
                      <span className="text-slate-500">
                        <span className="text-emerald-500">+{f.additions}</span> /{' '}
                        <span className="text-rose-500">-{f.deletions}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
