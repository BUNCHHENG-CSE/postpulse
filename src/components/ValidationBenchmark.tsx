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
} from 'lucide-react';

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
      {/* Benchmark Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                MVP Quality Verification
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">10 Real Commits Benchmark</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Publishability Quality Scoreboard
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              <strong>Validation Hypothesis:</strong> Generic AI writing tools sound like changelogs.
              To validate this engine, we evaluate 10 real-world developer commits. 
              <span className="text-slate-200">
                {' '}Fewer than 4 publishable with light edits means quality is insufficient.
              </span>
            </p>
          </div>

          {/* Large Metric Gauge */}
          <div className="flex items-center space-x-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex-shrink-0">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                metrics.thresholdPassed
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                  : 'border-amber-500 bg-amber-950/40 text-amber-300'
              }`}
            >
              {metrics.publishableCount}/10
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                {metrics.thresholdPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-xs font-bold text-slate-200">
                  {metrics.thresholdPassed ? 'QUALITY BAR PASSED' : 'BENCHMARK PENDING'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target: ≥ 4/10 ({metrics.publishablePercentage}% publishable)
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Ready As-Is: <strong>{metrics.breakdown.readyAsIs}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Light Edits Needed: <strong>{metrics.breakdown.lightEdits}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Heavy Edits Needed: <strong>{metrics.breakdown.heavyEdits}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Unpublishable: <strong>{metrics.breakdown.unpublishable}</strong></span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onResetSeed}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Seed Data</span>
            </button>

            <button
              onClick={onBatchGenerate}
              disabled={isBatchGenerating}
              className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBatchGenerating ? 'Generating all...' : 'Batch Generate All 10'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10 Commits Evaluation Cards */}
      <div className="space-y-3">
        {benchmarkItems.map(({ event, drafts, grade }, index) => {
          const isRated = Boolean(grade);
          const hasDrafts = drafts.length > 0;

          return (
            <div
              key={event.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                grade?.grade === 'ready_as_is' || grade?.grade === 'light_edits'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-900/30 border-slate-800/70'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Commit info */}
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-mono bg-slate-950 text-indigo-400 px-2 py-0.5 rounded border border-slate-800">
                      {event.shortSha}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-mono font-medium">
                      {event.worthiness.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      +{event.stats.additions} / -{event.stats.deletions} lines
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                      Score: {event.worthiness.score}
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectEvent(event)}
                    className="text-sm sm:text-base font-semibold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="text-xs text-slate-400 line-clamp-1">{event.description}</p>
                  )}

                  {/* Feedback display if previously rated */}
                  {grade?.developerFeedback && (
                    <div className="text-xs text-indigo-300/90 italic bg-indigo-950/30 border-l-2 border-indigo-500 pl-2 py-0.5 mt-1 rounded-r">
                      "{grade.developerFeedback}"
                    </div>
                  )}
                </div>

                {/* Rating Buttons */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onRateCommit(event.id, 'ready_as_is')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      grade?.grade === 'ready_as_is'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3 text-emerald-400" />
                    <span>Ready As-Is</span>
                  </button>

                  <button
                    onClick={() => onRateCommit(event.id, 'light_edits')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      grade?.grade === 'light_edits'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3 h-3 text-indigo-400" />
                    <span>Light Edits</span>
                  </button>

                  <button
                    onClick={() => onRateCommit(event.id, 'heavy_edits')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      grade?.grade === 'heavy_edits'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <span>Heavy Edits</span>
                  </button>

                  <button
                    onClick={() => onRateCommit(event.id, 'unpublishable')}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      grade?.grade === 'unpublishable'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <XCircle className="w-3 h-3 text-rose-400" />
                    <span>Trash</span>
                  </button>

                  <button
                    onClick={() => onSelectEvent(event)}
                    className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-800"
                    title="Open in Draft Studio"
                  >
                    <span>Studio</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
