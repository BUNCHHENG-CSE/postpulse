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
  Database,
  Zap,
  Bug,
  ShieldCheck,
  Palette,
  PackagePlus,
  Wrench,
  Copy,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EventCardProps {
  event: GitEvent;
  onSelectForStudio: (event: GitEvent) => void;
  onGenerate: (eventId: string) => Promise<void>;
  onDismiss: (eventId: string) => Promise<void>;
  isGenerating?: boolean;
  draftsCount?: number;
  isSelected?: boolean;
  onToggleSelect?: (eventId: string) => void;
  publishedUrl?: string;
}

export function EventCard({
  event,
  onSelectForStudio,
  onGenerate,
  onDismiss,
  isGenerating,
  draftsCount = 0,
  isSelected = false,
  onToggleSelect,
  publishedUrl,
}: EventCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  const copySha = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(event.sha || event.shortSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 1500);
  };

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'database_migration':
        return {
          label: 'Database Migration',
          icon: Database,
          badgeColor: 'text-purple-600 dark:text-purple-300 border-purple-500/30 bg-purple-500/10',
        };
      case 'performance':
        return {
          label: 'Performance Tuning',
          icon: Zap,
          badgeColor: 'text-amber-600 dark:text-amber-300 border-amber-500/30 bg-amber-500/10',
        };
      case 'bug_war_story':
        return {
          label: 'Bug War Story',
          icon: Bug,
          badgeColor: 'text-rose-600 dark:text-rose-300 border-rose-500/30 bg-rose-500/10',
        };
      case 'security_auth':
        return {
          label: 'Security & Auth',
          icon: ShieldCheck,
          badgeColor: 'text-emerald-600 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
        };
      case 'ui_ux':
        return {
          label: 'UI / UX Polish',
          icon: Palette,
          badgeColor: 'text-pink-600 dark:text-pink-300 border-pink-500/30 bg-pink-500/10',
        };
      case 'new_feature':
        return {
          label: 'New Feature',
          icon: PackagePlus,
          badgeColor: 'text-cyan-600 dark:text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
        };
      default:
        return {
          label: 'Internal Chore',
          icon: Wrench,
          badgeColor: 'text-muted-foreground border-border bg-muted/40',
        };
    }
  };

  const catConfig = getCategoryConfig(event.worthiness.category);
  const CatIcon = catConfig.icon;
  const score = event.worthiness.score;

  const isGoldmine = score >= 80;
  const isWorthy = score >= 50 && score < 80;

  const totalChurn = (event.stats.additions || 0) + (event.stats.deletions || 0);
  const addRatio = totalChurn > 0 ? ((event.stats.additions || 0) / totalChurn) * 100 : 50;

  const matchConventional = event.title.match(/^([a-zA-Z0-9_\-\(\)]+):\s*(.*)$/);
  const commitPrefix = matchConventional ? matchConventional[1] : null;
  const commitMainTitle = matchConventional ? matchConventional[2] : event.title;

  return (
    <Card
      className={`group relative rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-primary ring-2 ring-primary/40 bg-card shadow-xs'
          : event.status === 'dismissed'
          ? 'opacity-50 border-border/40 bg-card/30'
          : isGoldmine
          ? 'border-emerald-500/30 bg-card hover:border-emerald-500/50 hover:shadow-xs'
          : isWorthy
          ? 'border-primary/30 bg-card hover:border-primary/50 hover:shadow-xs'
          : 'border-border hover:border-border/80 bg-card'
      }`}
    >
      {/* Visual Accent Status Line on Left */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${
          isSelected
            ? 'bg-primary'
            : isGoldmine
            ? 'bg-gradient-to-b from-emerald-400 to-cyan-400'
            : isWorthy
            ? 'bg-gradient-to-b from-primary to-indigo-400'
            : 'bg-muted-foreground/30'
        }`}
      />

      <div className="p-4 sm:p-5 pl-5 sm:pl-6 space-y-3">
        {/* TOP BAR: Metadata & High-Tech Score Gauge */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Metadata Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selection Checkbox */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(event.id);
                }}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border bg-muted/60 hover:border-primary/50 text-transparent'
                }`}
                title={isSelected ? 'Deselect commit' : 'Select commit for weekly digest / batch action'}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
            )}

            {/* Category Tag */}
            <Badge
              variant="outline"
              className={`inline-flex items-center space-x-1.5 text-xs font-medium px-2 py-0.5 rounded-md ${catConfig.badgeColor}`}
            >
              <CatIcon className="w-3 h-3" />
              <span>{catConfig.label}</span>
            </Badge>

            {/* SHA Pill with 1-click copy */}
            <div className="inline-flex items-center space-x-1 bg-muted/60 border border-border rounded-md px-2 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              <GitCommit className="w-3 h-3 text-muted-foreground" />
              <span>{event.shortSha}</span>
              <button
                type="button"
                onClick={copySha}
                title="Copy commit SHA"
                className="hover:text-foreground ml-1 opacity-70 hover:opacity-100"
              >
                {copiedSha ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            </div>

            {/* Published Live Link Badge */}
            {publishedUrl && (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold hover:underline"
                title="View live post"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Post</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </a>
            )}

            {/* Repo info */}
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline-block">
              {event.repo}
            </span>

            {/* Time / Date */}
            <span className="text-xs text-muted-foreground/80 flex items-center space-x-1">
              <Clock className="w-3 h-3 opacity-60" />
              <span>
                {new Date(event.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </span>
          </div>

          {/* Right: High-Tech Worthiness Score */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-md border font-mono text-xs font-bold transition-all ${
                isGoldmine
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                  : isWorthy
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
              title={`Post-Worthiness Score: ${score}/100`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  isGoldmine ? 'text-emerald-500 dark:text-emerald-400 animate-pulse' : isWorthy ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className="text-sm tracking-tight">{score}</span>
              <span className="text-[10px] font-normal opacity-60">/100</span>
              <span
                className={`hidden md:inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold ${
                  isGoldmine
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
                    : isWorthy
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                }`}
              >
                {isGoldmine ? 'Goldmine' : isWorthy ? 'Worthy' : 'Chore'}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN TITLE & CONTEXT */}
        <div>
          <h3
            onClick={() => onSelectForStudio(event)}
            className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors cursor-pointer tracking-tight leading-snug flex flex-wrap items-baseline gap-1.5"
          >
            {commitPrefix && (
              <Badge variant="secondary" className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md">
                {commitPrefix}
              </Badge>
            )}
            <span>{commitMainTitle}</span>
          </h3>

          {event.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* CHURN DIFF BAR & QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 px-3 rounded-lg bg-muted/40 border border-border/60">
          {/* Left: Churn breakdown */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{event.stats.additions}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">-{event.stats.deletions}</span>
            </div>

            {/* Visual Churn Meter */}
            <div className="w-20 h-1.5 bg-rose-500/30 rounded-full overflow-hidden flex" title={`${addRatio.toFixed(0)}% additions`}>
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                style={{ width: `${addRatio}%` }}
              />
            </div>

            <div className="flex items-center space-x-1 text-muted-foreground text-xs">
              <FileCode className="w-3.5 h-3.5 opacity-70" />
              <span>{event.stats.totalFiles} {event.stats.totalFiles === 1 ? 'file' : 'files'}</span>
            </div>
          </div>

          {/* Right: Author & GitHub Link */}
          <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs text-muted-foreground">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>@{event.author.username || event.author.name}</span>
            </span>

            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                title="View on GitHub"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3 opacity-70" />
              </a>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          {/* Analysis Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
            <span>{showDetails ? 'Hide Intelligence' : 'AI Scoring & Files'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2">
            {draftsCount > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onSelectForStudio(event)}
                className="text-xs font-semibold gap-1.5 border border-primary/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>View {draftsCount} Drafts</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => onGenerate(event.id)}
                disabled={isGenerating}
                className="text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Generating...' : 'Generate 3 Drafts'}</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDismiss(event.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Dismiss commit from feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* EXPANDABLE INTELLIGENCE DRAWER */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-border bg-muted/20 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Why This Score? */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Worthiness Breakdown</span>
                </div>

                <div className="space-y-1.5">
                  {event.worthiness.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-muted-foreground flex items-start space-x-2 bg-card p-2 rounded-md border border-border"
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{reason}</span>
                    </div>
                  ))}

                  {event.worthiness.recommendedHook && (
                    <div className="mt-2 p-2.5 rounded-md bg-primary/10 border border-primary/20 text-xs">
                      <span className="text-primary font-semibold block mb-0.5">Recommended Post Hook:</span>
                      <p className="text-foreground italic">"{event.worthiness.recommendedHook}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Files Touched */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Key Files Changed</span>
                </div>

                {event.files && event.files.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {event.files.slice(0, 6).map((file, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono text-muted-foreground flex items-center justify-between bg-card p-2 rounded-md border border-border"
                      >
                        <span className="truncate max-w-[70%] text-foreground" title={file.filename}>
                          {file.filename}
                        </span>
                        <div className="flex items-center space-x-1 text-[11px] font-semibold flex-shrink-0">
                          <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                        </div>
                      </div>
                    ))}
                    {event.files.length > 6 && (
                      <div className="text-[11px] text-muted-foreground text-center py-1">
                        + {event.files.length - 6} more files
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-3 bg-card/40 rounded-md">
                    No individual file diff details recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
