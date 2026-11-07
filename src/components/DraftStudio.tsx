'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ContentDraft,
  DraftFormat,
  GitEvent,
  HeadlineVariation,
  SubredditRecommendation,
  ToneStyle,
  TweetThreadItem,
} from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ViralHeadlinesModal } from './ViralHeadlinesModal';
import { PublishModal } from './PublishModal';
import {
  splitIntoTweetThread,
  generateHeadlineVariations,
  getSubredditRecommendations,
} from '@/lib/generator';
import {
  Copy,
  Check,
  RotateCw,
  Sparkles,
  BookOpen,
  Share2,
  FileText,
  Clock,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  Eye,
  Columns,
  Edit3,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Heart,
  Bookmark,
  Send,
  ArrowUp,
  Flame,
  CheckCircle2,
  Globe,
  Radio,
  ExternalLink,
  Download,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const [previewMode, setPreviewMode] = useState<'mockup' | 'raw'>('mockup');
  const [copied, setCopied] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [editableTitle, setEditableTitle] = useState('');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // New Feature States
  const [isHeadlinesOpen, setIsHeadlinesOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isThreadMode, setIsThreadMode] = useState(false);
  const [copiedTweetIdx, setCopiedTweetIdx] = useState<number | null>(null);
  const [copiedAllThread, setCopiedAllThread] = useState(false);

  // Find active draft
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

  // Derived intelligence
  const headlineVariations = useMemo(() => {
    if (!event) return [];
    return generateHeadlineVariations(event);
  }, [event]);

  const recommendedSubreddits = useMemo(() => {
    if (!event) return [];
    return getSubredditRecommendations(event.worthiness.category);
  }, [event]);

  const threadTweets = useMemo(() => {
    if (!editableContent) return [];
    return splitIntoTweetThread(editableContent, editableTitle);
  }, [editableContent, editableTitle]);

  if (!event) {
    return (
      <Card className="flex flex-col items-center justify-center p-16 text-center border-border">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">No Commit Selected</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
          Select any commit from the Event Feed to generate, inspect, and export calibrated build-in-public drafts.
        </p>
      </Card>
    );
  }

  // Next / Prev commit navigation
  const currentIndex = events.findIndex((ev) => ev.id === event.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < events.length - 1;

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

  const handleCopySingleTweet = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTweetIdx(index);
      setTimeout(() => setCopiedTweetIdx(null), 1800);
    } catch {
      // Fallback
    }
  };

  const handleCopyFullThread = async () => {
    try {
      const fullText = threadTweets.map((t) => t.text).join('\n\n---\n\n');
      await navigator.clipboard.writeText(fullText);
      setCopiedAllThread(true);
      setTimeout(() => setCopiedAllThread(false), 2000);
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

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('draft-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editableContent.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = editableContent.substring(0, start) + replacement + editableContent.substring(end);
    setEditableContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 0);
  };

  const formatConfigs: Record<
    DraftFormat,
    {
      label: string;
      platform: string;
      tag: string;
      icon: any;
      desc: string;
      badgeColor: string;
    }
  > = {
    technical_lesson: {
      label: 'Technical Deep-Dive',
      platform: 'Reddit (r/SideProject, r/webdev) & Dev.to',
      tag: 'REDDIT & DEV.TO',
      icon: BookOpen,
      desc: 'Raw engineering problem, diff architecture, and lessons learned. Zero corporate hype.',
      badgeColor: 'text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    },
    build_in_public: {
      label: 'Founder Story',
      platform: 'Indie Hackers, LinkedIn & X/Twitter',
      tag: 'INDIE HACKERS & X',
      icon: Share2,
      desc: 'The founder reality: why this commit mattered, the struggle, and open discussion.',
      badgeColor: 'text-primary bg-primary/10 border-primary/20',
    },
    changelog: {
      label: 'Product Changelog',
      platform: 'In-App Modal & Release Notes',
      tag: 'CUSTOMER RELEASE',
      icon: FileText,
      desc: 'Crisp 1-3 line user-centric announcement translating code churn into customer benefit.',
      badgeColor: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
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

  const wordCount = editableContent.split(/\s+/).filter(Boolean).length;
  const checklistItems = activeDraft?.publishChecklist || [];
  const completedChecks = checklistItems.filter((item) => checklistState[item]).length;

  return (
    <div className="space-y-5">
      {/* HEADER BANNER: Commit Navigator */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md">
                {event.shortSha}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{event.repo}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs text-foreground font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">+{event.stats.additions}</span> /{' '}
                <span className="text-rose-600 dark:text-rose-400">-{event.stats.deletions}</span> lines ({event.stats.totalFiles} files)
              </span>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/25 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Score: {event.worthiness.score}/100</span>
              </Badge>

              {activeDraft?.publishedUrl && (
                <a
                  href={activeDraft.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:underline"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Post</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>

            <h2 className="text-base sm:text-xl font-bold text-foreground tracking-tight truncate">
              {event.title}
            </h2>
          </div>

          {/* Quick Commit Switcher Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => hasPrev && onSelectEvent(events[currentIndex - 1])}
              disabled={!hasPrev}
              title="Previous Commit"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <select
              value={event.id}
              onChange={(e) => {
                const found = events.find((ev) => ev.id === e.target.value);
                if (found) onSelectEvent(found);
              }}
              className="bg-card border border-border rounded-md text-xs text-foreground p-2 max-w-[220px] sm:max-w-xs focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  [{ev.shortSha}] {ev.title.slice(0, 38)}...
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => hasNext && onSelectEvent(events[currentIndex + 1])}
              disabled={!hasNext}
              title="Next Commit"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* MODERN FORMAT SELECTOR TABS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['technical_lesson', 'build_in_public', 'changelog'] as DraftFormat[]).map((fmt) => {
          const config = formatConfigs[fmt];
          const Icon = config.icon;
          const isSelected = selectedFormat === fmt;
          const hasDraft = drafts.some((d) => d.eventId === event.id && d.format === fmt);

          return (
            <Card
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`p-3.5 rounded-xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-primary shadow-xs bg-card ring-1 ring-primary/30'
                  : 'border-border hover:border-border/80 hover:bg-muted/40'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
              )}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-md ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-foreground">{config.label}</span>
                </div>

                {hasDraft && (
                  <Badge variant="outline" className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    Ready
                  </Badge>
                )}
              </div>
              <p className="text-xs text-primary font-medium mb-1">{config.platform}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{config.desc}</p>
            </Card>
          );
        })}
      </div>

      {/* SUBREDDIT ADVISOR BANNER (Shown for Reddit / Dev.to & Founder Story formats) */}
      {(selectedFormat === 'technical_lesson' || selectedFormat === 'build_in_public') && recommendedSubreddits.length > 0 && (
        <Card className="p-3.5 border-amber-500/30 bg-amber-500/5 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center font-bold text-[10px] text-white">
                r/
              </span>
              <span className="text-xs font-bold font-mono text-foreground">
                Subreddit Matcher & Community Guide:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {recommendedSubreddits.map((sub) => (
                <a
                  key={sub.sub}
                  href={`https://www.reddit.com/r/${sub.sub}/submit?title=${encodeURIComponent(
                    editableTitle
                  )}&text=${encodeURIComponent(editableContent)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-card border border-border hover:border-orange-500/50 hover:text-orange-500 transition-colors shadow-2xs"
                  title={`${sub.matchReason} (Flair: ${sub.recommendedFlair || 'None'})`}
                >
                  <span>r/{sub.sub}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            🛡️ <span className="font-semibold text-foreground">Anti-Ban Advice:</span> {recommendedSubreddits[0]?.antiBanTips}
          </p>
        </Card>
      )}

      {/* WORKSPACE AREA */}
      {activeDraft ? (
        <Card className="rounded-xl border-border overflow-hidden shadow-xs">
          {/* TOOLBAR STRIP */}
          <div className="p-3 sm:p-4 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3">
            {/* Left Controls: Tone & AI Rewrite */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-card border border-border rounded-md px-2.5 py-1 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Tone:</span>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as ToneStyle)}
                  className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer"
                >
                  {tones.map((t) => (
                    <option key={t.id} value={t.id} className="bg-card text-foreground">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="text-xs gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-primary' : ''}`} />
                <span>{isGenerating ? 'Drafting...' : 'AI Rewrite'}</span>
              </Button>

              {/* Thread Mode Switcher */}
              <button
                type="button"
                onClick={() => setIsThreadMode(!isThreadMode)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 border ${
                  isThreadMode
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
                title="Split long post into sequential 280-character tweets"
              >
                <span>𝕏 Thread ({threadTweets.length})</span>
              </button>
            </div>

            {/* Right Controls: View modes, Save, Copy, and Publish Hub */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Split / Edit / Preview Selector */}
              {!isThreadMode && (
                <div className="hidden sm:flex bg-card border border-border rounded-md p-0.5 text-xs">
                  <button
                    onClick={() => setActiveTab('split')}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1 ${
                      activeTab === 'split' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Columns className="w-3 h-3" />
                    <span>Split</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1 ${
                      activeTab === 'edit' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1 ${
                      activeTab === 'preview' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              )}

              {/* Save Draft */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>

              {/* Copy Post Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs font-semibold gap-1.5 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>

              {/* 1-Click Publish & Share Hub Button */}
              <Button
                size="sm"
                onClick={() => setIsPublishModalOpen(true)}
                className="text-xs font-bold gap-1.5 bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 hover:opacity-90 text-white shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Publish Hub</span>
              </Button>
            </div>
          </div>

          {/* MAIN EDITING & PREVIEW AREA */}
          {isThreadMode ? (
            /* 𝕏 TWITTER THREAD COMPOSER & SPLITTER */
            <div className="p-4 sm:p-6 space-y-4 bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                <div>
                  <h4 className="text-sm font-bold font-mono text-foreground flex items-center space-x-2">
                    <span>𝕏 Tweet Thread Splitter</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {threadTweets.length} Tweets
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically fragmented into 280-character chunks with numbered hooks.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyFullThread}
                    className="text-xs font-semibold gap-1.5"
                  >
                    {copiedAllThread ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAllThread ? 'Copied All!' : 'Copy Thread'}</span>
                  </Button>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      threadTweets[0]?.text || editableTitle
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 bg-foreground text-background font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs hover:opacity-90 transition-opacity"
                  >
                    <span>Tweet Opener</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Tweet cards list */}
              <div className="space-y-3">
                {threadTweets.map((tweet) => {
                  const isCopied = copiedTweetIdx === tweet.index;
                  const isOverLimit = tweet.charCount > 280;

                  return (
                    <div
                      key={tweet.index}
                      className={`p-4 rounded-xl border bg-card transition-all ${
                        isOverLimit
                          ? 'border-rose-500/50 ring-1 ring-rose-500/30'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-border mb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] font-mono">
                            {tweet.index}
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            Tweet {tweet.index} of {tweet.total}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isOverLimit ? 'text-rose-500' : 'text-muted-foreground'
                            }`}
                          >
                            {tweet.charCount} / 280
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopySingleTweet(tweet.text, tweet.index)}
                            className="inline-flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>

                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet.text)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            <span>Post</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                        {tweet.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STANDARD SPLIT / EDIT / PREVIEW WORKSPACE */
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-[520px]">
              {/* LEFT: MARKDOWN EDITOR PANE */}
              {(activeTab === 'split' || activeTab === 'edit') && (
                <div className="p-4 sm:p-5 flex flex-col space-y-3 bg-card/40">
                  {/* Editor Header & Formatting Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
                    <div className="flex items-center space-x-1 bg-card p-1 rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                        title="Bold (**text**)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                        title="Italic (*text*)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('`', '`')}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                        title="Inline Code (`code`)"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('> ')}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                        title="Quote (> quote)"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('- ')}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                        title="List Item (- item)"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{activeDraft.estimatedReadTime}</span>
                      </span>
                      <span>{wordCount} words</span>
                    </div>
                  </div>

                  {/* Title Input with Viral Headline Lab Trigger */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-mono uppercase text-muted-foreground">
                        Post Title / Catchy Hook:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsHeadlinesOpen(true)}
                        className="inline-flex items-center space-x-1 text-[11px] font-mono text-primary hover:text-primary/80 font-semibold"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>✨ Viral Headline Lab (5 Angles)</span>
                      </button>
                    </div>
                    <Input
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      placeholder="Punchy headline or hook..."
                      className="font-bold text-sm"
                    />
                  </div>

                  {/* Content Textarea */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Post Content (Markdown):
                    </label>
                    <Textarea
                      id="draft-textarea"
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      placeholder="Write or refine your post content..."
                      className="flex-1 min-h-[380px] font-mono text-sm leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* RIGHT: REALISTIC PLATFORM PREVIEW PANE */}
              {(activeTab === 'split' || activeTab === 'preview') && (
                <div className="p-4 sm:p-5 flex flex-col space-y-3 bg-muted/10 overflow-y-auto max-h-[660px]">
                  {/* Preview Header & Mockup Switcher */}
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono uppercase text-muted-foreground">Live Preview</span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${formatConfigs[selectedFormat].badgeColor}`}>
                        {formatConfigs[selectedFormat].platform}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-1 bg-card p-0.5 rounded-md border border-border text-xs">
                      <button
                        onClick={() => setPreviewMode('mockup')}
                        className={`px-2 py-0.5 rounded font-medium ${
                          previewMode === 'mockup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Social Mockup
                      </button>
                      <button
                        onClick={() => setPreviewMode('raw')}
                        className={`px-2 py-0.5 rounded font-medium ${
                          previewMode === 'raw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Clean Render
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  {previewMode === 'mockup' ? (
                    selectedFormat === 'technical_lesson' ? (
                      /* REDDIT CARD MOCKUP */
                      <div className="bg-card dark:bg-[#0e1117] border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center font-bold text-[10px] text-white">
                              r/
                            </span>
                            <span className="font-bold text-foreground">
                              r/{recommendedSubreddits[0]?.sub || 'SideProject'}
                            </span>
                            <span className="opacity-40">•</span>
                            <span>Posted by u/{event.author.username || 'developer'} 2h ago</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {recommendedSubreddits[0]?.recommendedFlair || 'Technical Deep-Dive'}
                          </Badge>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          {editableTitle || 'Post title preview...'}
                        </h3>

                        <div className="prose dark:prose-invert max-w-none text-foreground text-sm">
                          <MarkdownRenderer content={editableContent} />
                        </div>

                        <div className="flex items-center space-x-4 pt-3 border-t border-border text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1 bg-muted/50 px-2.5 py-1 rounded-full border border-border">
                            <ArrowUp className="w-3.5 h-3.5 text-orange-500" />
                            <span className="font-bold text-foreground">142</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-muted/50 px-2.5 py-1 rounded-full border border-border">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>38 Comments</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-muted/50 px-2.5 py-1 rounded-full border border-border">
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </div>
                        </div>
                      </div>
                    ) : selectedFormat === 'build_in_public' ? (
                      /* INDIE HACKERS & X MOCKUP */
                      <div className="bg-card dark:bg-[#0b101e] border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center font-bold text-sm text-white">
                              {(event.author.name || 'Dev')[0]}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <span className="font-bold text-sm text-foreground">{event.author.name || 'Developer'}</span>
                                <span className="text-xs text-muted-foreground">@{event.author.username || 'solo_dev'}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground">Solo Founder • Building in Public</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Indie Hackers & X
                          </Badge>
                        </div>

                        {editableTitle && (
                          <h4 className="font-bold text-base text-foreground border-l-2 border-primary pl-2">
                            {editableTitle}
                          </h4>
                        )}

                        <div className="prose dark:prose-invert max-w-none text-foreground text-sm leading-relaxed">
                          <MarkdownRenderer content={editableContent} />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1 hover:text-rose-500 cursor-pointer">
                            <Heart className="w-3.5 h-3.5" />
                            <span>89</span>
                          </span>
                          <span className="flex items-center space-x-1 hover:text-cyan-500 cursor-pointer">
                            <Repeat className="w-3.5 h-3.5" />
                            <span>24</span>
                          </span>
                          <span className="flex items-center space-x-1 hover:text-primary cursor-pointer">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>17 replies</span>
                          </span>
                          <span className="flex items-center space-x-1 hover:text-amber-500 cursor-pointer">
                            <Bookmark className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* PRODUCT CHANGELOG MOCKUP */
                      <div className="bg-card dark:bg-[#0b1222] border border-emerald-500/30 rounded-xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-300 font-mono">RELEASE NOTE</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">v1.2.0 • Today</span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground">
                          {editableTitle || 'What’s new in this release'}
                        </h3>

                        <div className="prose dark:prose-invert max-w-none text-foreground text-sm leading-relaxed">
                          <MarkdownRenderer content={editableContent} />
                        </div>

                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
                          <span>Customer In-App Modal Preview</span>
                          <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                            Got it, looks great!
                          </Badge>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Standard Markdown View */
                    <div className="prose dark:prose-invert max-w-none">
                      <MarkdownRenderer content={editableContent} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DEVELOPER PRE-PUBLISH QUALITY CHECKLIST */}
          <div className="p-4 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
                <CheckSquare className="w-4 h-4 text-primary" />
                <span>Developer Pre-Publish Quality Checklist:</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">
                  {completedChecks} of {checklistItems.length} passed
                </span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{
                      width: `${checklistItems.length ? (completedChecks / checklistItems.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {checklistItems.map((item, idx) => {
                const isChecked = checklistState[item] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => toggleChecklist(item)}
                    className={`flex items-center space-x-2 text-xs p-2 rounded-md cursor-pointer border transition-all ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                        : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                    )}
                    <span className={isChecked ? 'line-through opacity-80' : ''}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        /* Empty Draft State */
        <Card className="p-12 border-dashed border-border text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              No Draft Created for this Format Yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
              Generate tailored post drafts for Reddit, Indie Hackers, and In-App Changelogs from this commit.
            </p>
          </div>
          <Button
            onClick={() => onRegenerateDraft(event.id, selectedFormat, selectedTone)}
            disabled={isGenerating}
            className="text-xs font-semibold gap-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating Calibrated Drafts...' : 'Generate 3 Drafts Now'}</span>
          </Button>
        </Card>
      )}

      {/* VIRAL HEADLINES LAB MODAL */}
      <ViralHeadlinesModal
        isOpen={isHeadlinesOpen}
        onClose={() => setIsHeadlinesOpen(false)}
        headlines={headlineVariations}
        currentTitle={editableTitle}
        onSelectHeadline={(headline) => {
          setEditableTitle(headline);
          if (activeDraft) {
            onUpdateDraft(activeDraft.id, { title: headline });
          }
        }}
        event={event}
      />

      {/* 1-CLICK PUBLISH & SHARE HUB MODAL */}
      {activeDraft && (
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          draft={activeDraft}
          event={event}
          recommendedSubreddits={recommendedSubreddits}
          onMarkPublished={async (url) => {
            await onUpdateDraft(activeDraft.id, { publishedUrl: url });
          }}
        />
      )}
    </div>
  );
}
