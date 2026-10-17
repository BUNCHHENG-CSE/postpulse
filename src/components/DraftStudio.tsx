'use client';

import React, { useState, useEffect } from 'react';
import { ContentDraft, DraftFormat, GitEvent, ToneStyle } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Copy,
  Check,
  RotateCw,
  Sparkles,
  ExternalLink,
  BookOpen,
  Share2,
  FileText,
  Clock,
  CheckSquare,
  Square,
  SlidersHorizontal,
} from 'lucide-react';

interface DraftStudioProps {
  event: GitEvent | null;
  events: GitEvent[];
  onSelectEvent: (event: GitEvent) => void;
  drafts: ContentDraft[];
  onUpdateDraft: (id: string, updates: Partial<ContentDraft>) => Promise<void>;
  onRegenerateDraft: (eventId: string, format: DraftFormat, tone?: ToneStyle) => Promise<void>;
  isGenerating?: boolean;
}

export function DraftStudio({
  event,
  events,
  onSelectEvent,
  drafts,
  onUpdateDraft,
  onRegenerateDraft,
  isGenerating,
}: DraftStudioProps) {
  const [selectedFormat, setSelectedFormat] = useState<DraftFormat>('technical_lesson');
  const [selectedTone, setSelectedTone] = useState<ToneStyle>('authentic_raw');
  const [activeTab, setActiveTab] = useState<'split' | 'edit' | 'preview'>('split');
  const [copied, setCopied] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [editableTitle, setEditableTitle] = useState('');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Find the active draft for this event and format
  const activeDraft = drafts.find(
    (d) => d.eventId === event?.id && d.format === selectedFormat
  );

  useEffect(() => {
    if (activeDraft) {
      setEditableContent(activeDraft.content);
      setEditableTitle(activeDraft.title);
      setSelectedTone(activeDraft.tone);
    } else {
      setEditableContent('');
      setEditableTitle('');
    }
  }, [activeDraft, selectedFormat, event?.id]);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
        <Sparkles className="w-10 h-10 text-indigo-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">No Commit Selected</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Select any commit or release from the Event Feed to view, edit, and export calibrated drafts.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    if (!editableContent) return;
    try {
      await navigator.clipboard.writeText(editableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSave = async () => {
    if (!activeDraft) return;
    setIsSaving(true);
    await onUpdateDraft(activeDraft.id, {
      content: editableContent,
      title: editableTitle,
      tone: selectedTone,
    });
    setIsSaving(false);
  };

  const handleRegenerate = async () => {
    if (!event) return;
    await onRegenerateDraft(event.id, selectedFormat, selectedTone);
  };

  const toggleChecklist = (item: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const formatLabels: Record<DraftFormat, { label: string; platform: string; icon: any; desc: string }> = {
    technical_lesson: {
      label: 'Technical Lesson',
      platform: 'Reddit (r/SideProject, r/webdev) & Dev.to',
      icon: BookOpen,
      desc: 'Raw engineering problem, diff architecture, and lessons learned. Zero corporate hype.',
    },
    build_in_public: {
      label: 'Build-in-Public Story',
      platform: 'Indie Hackers, LinkedIn & X/Twitter',
      icon: Share2,
      desc: 'The founder reality: why this commit mattered, the struggle, and open discussion.',
    },
    changelog: {
      label: 'Product Changelog',
      platform: 'Release Notes & In-App Modal',
      icon: FileText,
      desc: 'Crisp 1-3 line user-centric announcement translating code churn into customer benefit.',
    },
  };

  const tones: { id: ToneStyle; label: string }[] = [
    { id: 'authentic_raw', label: 'Authentic & Raw' },
    { id: 'war_story', label: 'Bug War Story' },
    { id: 'hard_lesson', label: 'Hard Lesson' },
    { id: 'spicy_take', label: 'Spicy / Contrarian' },
    { id: 'founder_honest', label: 'Founder Vulnerable' },
    { id: 'crisp_minimal', label: 'Crisp & Minimal' },
  ];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono bg-slate-800 text-indigo-400 px-2 py-0.5 rounded border border-slate-700">
                {event.shortSha}
              </span>
              <span className="text-xs text-slate-400 font-mono">{event.repo}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                +{event.stats.additions} / -{event.stats.deletions} lines across {event.stats.totalFiles} files
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Worthiness: {event.worthiness.score}/100
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
              {event.title}
            </h2>
          </div>

          {/* Commit selector dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Switch commit:</label>
            <select
              value={event.id}
              onChange={(e) => {
                const found = events.find((ev) => ev.id === e.target.value);
                if (found) onSelectEvent(found);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 p-2 max-w-xs focus:ring-1 focus:ring-indigo-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  [{ev.shortSha}] {ev.title.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 Format Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['technical_lesson', 'build_in_public', 'changelog'] as DraftFormat[]).map((fmt) => {
          const config = formatLabels[fmt];
          const Icon = config.icon;
          const isSelected = selectedFormat === fmt;
          const hasDraft = drafts.some((d) => d.eventId === event.id && d.format === fmt);

          return (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-slate-100">{config.label}</span>
                </div>
                {hasDraft && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300/80 font-medium mb-1">{config.platform}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{config.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Draft Workspace */}
      {activeDraft ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              {/* Tone selector */}
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Tone:</span>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as ToneStyle)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1 focus:ring-1 focus:ring-indigo-500"
                >
                  {tones.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Regenerate button */}
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Drafting...' : 'Regenerate'}</span>
              </button>
            </div>

            {/* View Mode & Copy/Save Actions */}
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setActiveTab('split')}
                  className={`px-2.5 py-0.5 rounded ${
                    activeTab === 'split' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-2.5 py-0.5 rounded ${
                    activeTab === 'edit' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-0.5 rounded ${
                    activeTab === 'preview' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Preview
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-medium shadow-md shadow-indigo-600/20 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Post'}</span>
              </button>
            </div>
          </div>

          {/* Editor & Preview Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[500px]">
            {/* Editor Pane */}
            {(activeTab === 'split' || activeTab === 'edit') && (
              <div className="p-4 sm:p-5 flex flex-col space-y-3 bg-slate-950/30">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                  <span className="font-mono uppercase text-[11px] text-slate-500">Markdown Editor</span>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{activeDraft.estimatedReadTime}</span>
                    </span>
                    <span>{editableContent.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>

                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  placeholder="Post title or hook..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  placeholder="Write or refine your post content in markdown..."
                  className="w-full flex-1 min-h-[380px] bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* Preview Pane */}
            {(activeTab === 'split' || activeTab === 'preview') && (
              <div className="p-4 sm:p-6 flex flex-col space-y-4 bg-slate-900/20 overflow-y-auto max-h-[600px]">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono uppercase text-[11px] text-slate-500">Formatted Preview</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      {formatLabels[selectedFormat].platform}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">How it looks on destination</span>
                </div>

                <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={editableContent} />
                </div>
              </div>
            )}
          </div>

          {/* Developer Pre-Publish Checklist */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Developer Pre-Publish Checklist:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(activeDraft.publishChecklist || []).map((item, idx) => {
                const isChecked = checklistState[item] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => toggleChecklist(item)}
                    className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer p-1.5 rounded hover:bg-slate-900"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    )}
                    <span className={isChecked ? 'line-through text-slate-500' : ''}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty Draft State: Prompt to generate */
        <div className="p-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-center space-y-4">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              Draft not yet generated for this format
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click below to generate all 3 calibrated draft formats for this commit.
            </p>
          </div>
          <button
            onClick={() => onRegenerateDraft(event.id, selectedFormat, selectedTone)}
            disabled={isGenerating}
            className="inline-flex items-center space-x-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating Calibrated Drafts...' : 'Generate 3 Drafts Now'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
