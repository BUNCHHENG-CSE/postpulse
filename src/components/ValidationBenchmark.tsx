'use client';

import React, { useState } from 'react';
import { GitEvent, ContentDraft } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  Edit3,
  XCircle,
  Award,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BenchmarkItem {
  event: GitEvent;
  drafts: ContentDraft[];
  grade: {
    grade: 'ready_as_is' | 'light_edits' | 'heavy_edits' | 'unpublishable';
    developerFeedback?: string;
    ratedAt: string;
  } | null;
}

interface ValidationBenchmarkProps {
  benchmarkItems: BenchmarkItem[];
  metrics: {
    totalEvaluated: number;
    publishableCount: number;
    publishablePercentage: number;
    thresholdPassed: boolean;
    thresholdTarget: number;
    thresholdStatus: string;
    breakdown: {
      readyAsIs: number;
      lightEdits: number;
      heavyEdits: number;
      unpublishable: number;
    };
  };
  onRateCommit: (
    eventId: string,
    grade: 'ready_as_is' | 'light_edits' | 'heavy_edits' | 'unpublishable',
    feedback?: string
  ) => Promise<void>;
  onBatchGenerate: () => Promise<void>;
  onResetSeed: () => Promise<void>;
  onSelectEvent: (event: GitEvent) => void;
  isBatchGenerating?: boolean;
}

export function ValidationBenchmark({
  benchmarkItems,
  metrics,
  onRateCommit,
  onBatchGenerate,
  onResetSeed,
  onSelectEvent,
  isBatchGenerating,
}: ValidationBenchmarkProps) {
  const [activeFeedbackEvent, setActiveFeedbackEvent] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const submitFeedback = async (eventId: string, grade: any) => {
    await onRateCommit(eventId, grade, feedbackText);
    setActiveFeedbackEvent(null);
    setFeedbackText('');
  };

  return (
    <div className="space-y-6">
      {/* BENCHMARK HEADER BANNER */}
      <Card className="rounded-xl p-6 sm:p-7 relative overflow-hidden border-border bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs font-mono font-semibold gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30">
                <Award className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>10-Commit Quality Verification</span>
              </Badge>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs text-muted-foreground">Zero Corporate Hype Bar</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Publishability Quality Scoreboard
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <strong>Validation Hypothesis:</strong> Generic AI content sounds like boring marketing fluff.
              To validate this engine, we evaluate 10 real developer commits against strict criteria. 
              Fewer than 4 publishable with light edits means quality is rejected.
            </p>
          </div>

          {/* LARGE METRIC GAUGE CARD */}
          <div className="flex items-center space-x-4 p-4 rounded-xl border border-border bg-muted/40 flex-shrink-0">
            <div
              className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-bold font-mono border-2 shadow-xs ${
                metrics.thresholdPassed
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  : 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-300'
              }`}
            >
              <span className="text-xl leading-none">{metrics.publishableCount}</span>
              <span className="text-[10px] text-muted-foreground font-normal mt-0.5">/ 10</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                {metrics.thresholdPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                )}
                <span className="text-xs font-extrabold tracking-wide uppercase text-foreground">
                  {metrics.thresholdPassed ? 'QUALITY BAR PASSED' : 'BENCHMARK PENDING'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Target: ≥ 4/10 ({metrics.publishablePercentage}% publishable)
              </p>
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metrics.thresholdPassed ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, (metrics.publishableCount / 10) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 SCORE DISTRIBUTION CARDS & ACTIONS */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
            <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-xs">
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ready As-Is</span>
              </div>
              <span className="text-base font-bold font-mono text-foreground">{metrics.breakdown.readyAsIs}</span>
            </div>

            <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-xs">
              <div className="flex items-center space-x-1.5 text-primary font-semibold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Light Edits</span>
              </div>
              <span className="text-base font-bold font-mono text-foreground">{metrics.breakdown.lightEdits}</span>
            </div>

            <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-xs">
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-semibold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Heavy Edits</span>
              </div>
              <span className="text-base font-bold font-mono text-foreground">{metrics.breakdown.heavyEdits}</span>
            </div>

            <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-xs">
              <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 font-semibold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Unpublishable</span>
              </div>
              <span className="text-base font-bold font-mono text-foreground">{metrics.breakdown.unpublishable}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetSeed}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seed</span>
            </Button>

            <Button
              size="sm"
              onClick={onBatchGenerate}
              disabled={isBatchGenerating}
              className="text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBatchGenerating ? 'Generating all...' : 'Batch Generate All 10'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 10 COMMITS EVALUATION LIST */}
      <div className="space-y-3">
        {benchmarkItems.map(({ event, drafts, grade }, index) => {
          const currentGrade = grade?.grade;

          return (
            <Card
              key={event.id}
              className={`rounded-xl p-4 sm:p-5 border transition-all ${
                currentGrade === 'ready_as_is'
                  ? 'border-emerald-500/40 bg-emerald-500/[0.03]'
                  : currentGrade === 'light_edits'
                  ? 'border-primary/35 bg-primary/[0.03]'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Commit info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-muted-foreground px-2 py-0.5">
                      #{index + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-mono font-semibold px-2 py-0.5">
                      {event.shortSha}
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase font-mono font-medium">
                      {event.worthiness.category.replace('_', ' ')}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400">+{event.stats.additions}</span> /{' '}
                      <span className="text-rose-600 dark:text-rose-400">-{event.stats.deletions}</span>
                    </span>
                    <Badge variant="outline" className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 px-2 py-0.2 rounded-full font-semibold">
                      Score: {event.worthiness.score}
                    </Badge>
                  </div>

                  <h4
                    onClick={() => onSelectEvent(event)}
                    className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                  >
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                  )}

                  {/* Feedback display if previously rated */}
                  {grade?.developerFeedback && (
                    <div className="text-xs text-primary italic bg-primary/10 border-l-2 border-primary pl-2.5 py-1 mt-1 rounded-r-md max-w-2xl">
                      "{grade.developerFeedback}"
                    </div>
                  )}
                </div>

                {/* Streamlined Quality Rating Control Bar */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <div className="flex items-center p-1 rounded-md bg-muted/60 border border-border text-xs">
                    <button
                      onClick={() => onRateCommit(event.id, 'ready_as_is')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-all ${
                        currentGrade === 'ready_as_is'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Ready as-is without manual rewriting"
                    >
                      <ThumbsUp className="w-3 h-3 text-emerald-300" />
                      <span>Ready</span>
                    </button>

                    <button
                      onClick={() => onRateCommit(event.id, 'light_edits')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-all ${
                        currentGrade === 'light_edits'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Publishable after minor touchups"
                    >
                      <Edit3 className="w-3 h-3 text-primary-foreground" />
                      <span>Light</span>
                    </button>

                    <button
                      onClick={() => onRateCommit(event.id, 'heavy_edits')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-all ${
                        currentGrade === 'heavy_edits'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Needs extensive manual rewriting"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                      <span>Heavy</span>
                    </button>

                    <button
                      onClick={() => onRateCommit(event.id, 'unpublishable')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-all ${
                        currentGrade === 'unpublishable'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Generic fluff / unpublishable"
                    >
                      <XCircle className="w-3 h-3 text-rose-300" />
                      <span>Trash</span>
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectEvent(event)}
                    className="text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10"
                    title="Open in Draft Studio"
                  >
                    <span>Studio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
