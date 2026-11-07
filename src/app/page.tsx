'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GitEvent, ContentDraft, EngineSettings, WeeklyDigest } from '@/types';
import { Navbar } from '@/components/Navbar';
import { EventCard } from '@/components/EventCard';
import { DraftStudio } from '@/components/DraftStudio';
import { ValidationBenchmark } from '@/components/ValidationBenchmark';
import { SimulateCommitModal } from '@/components/SimulateCommitModal';
import { ImportRepoModal } from '@/components/ImportRepoModal';
import { SettingsModal } from '@/components/SettingsModal';
import { WeeklyDigestModal } from '@/components/WeeklyDigestModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import {
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Sliders,
  Flame,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  FileCode2,
  Search,
  Database,
  Zap,
  Bug,
  ShieldCheck,
  Palette,
  PackagePlus,
  Wrench,
  Layers,
  Radio,
  X,
  RefreshCw,
  GitCommit,
  Calendar,
  Keyboard,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Globe,
  Share2,
} from 'lucide-react';
import { GithubIcon } from '@/components/Icons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'feed' | 'studio' | 'benchmark' | 'settings'>('feed');
  const [events, setEvents] = useState<GitEvent[]>([]);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [settings, setSettings] = useState<EngineSettings | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GitEvent | null>(null);
  const [validationData, setValidationData] = useState<any>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'worthy' | 'top'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'drafted' | 'published' | 'dismissed'>('all');

  // Multi-Selection State for Batch Operations
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Modals
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [digestData, setDigestData] = useState<WeeklyDigest | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCompilingDigest, setIsCompilingDigest] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        setIsSimulateOpen(false);
        setIsImportOpen(false);
        setIsSettingsOpen(false);
        setIsDigestOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        // Step forward in events
        if (events.length > 0) {
          const currIdx = events.findIndex((ev) => ev.id === selectedEvent?.id);
          if (currIdx >= 0 && currIdx < events.length - 1) {
            setSelectedEvent(events[currIdx + 1]);
          }
        }
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        // Step backward in events
        if (events.length > 0) {
          const currIdx = events.findIndex((ev) => ev.id === selectedEvent?.id);
          if (currIdx > 0) {
            setSelectedEvent(events[currIdx - 1]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events, selectedEvent]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, draftsRes, settingsRes, validationRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/drafts'),
        fetch('/api/settings'),
        fetch('/api/validation'),
      ]);

      const [eventsData, draftsData, settingsData, valData] = await Promise.all([
        eventsRes.json(),
        draftsRes.json(),
        settingsRes.json(),
        validationRes.json(),
      ]);

      const evs = eventsData.events || [];
      setEvents(evs);
      setDrafts(draftsData.drafts || []);
      setSettings(settingsData.settings || null);
      setValidationData(valData || null);

      if (evs.length > 0 && !selectedEvent) {
        setSelectedEvent(evs[0]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      addToast('error', 'Sync Failed', 'Could not load engine state.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (eventId: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/generate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', '3 Drafts Generated', 'Reddit, Indie Hackers & Changelog ready in Studio.');
        const [draftsRes, eventsRes, valRes] = await Promise.all([
          fetch('/api/drafts'),
          fetch('/api/events'),
          fetch('/api/validation'),
        ]);
        const dJson = await draftsRes.json();
        const eJson = await eventsRes.json();
        const vJson = await valRes.json();

        setDrafts(dJson.drafts || []);
        setEvents(eJson.events || []);
        setValidationData(vJson);

        const target = (eJson.events || []).find((e: GitEvent) => e.id === eventId);
        if (target) {
          setSelectedEvent(target);
          setActiveTab('studio');
        }
      }
    } catch (err) {
      console.error('Failed to generate drafts:', err);
      addToast('error', 'Generation Failed', 'Could not generate draft content.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateDraft = async (eventId: string, format: any, tone?: any) => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, tone }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Draft Rewritten', `Tuned with ${tone || 'authentic'} developer tone.`);
        const draftsRes = await fetch('/api/drafts');
        const dJson = await draftsRes.json();
        setDrafts(dJson.drafts || []);
      }
    } catch (err) {
      console.error('Failed to regenerate draft:', err);
      addToast('error', 'Rewrite Failed', 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateDraft = async (id: string, updates: Partial<ContentDraft>) => {
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Draft Saved', 'Changes successfully persisted.');
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
        if (updates.publishedUrl) {
          setEvents((prev) =>
            prev.map((e) => (e.id === data.draft.eventId ? { ...e, status: 'published' } : e))
          );
        }
      }
    } catch (err) {
      console.error('Failed to update draft:', err);
      addToast('error', 'Save Error', 'Could not save draft changes.');
    }
  };

  const handleDismiss = async (eventId: string) => {
    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: 'dismissed' as const } : e))
      );
      addToast('info', 'Commit Dismissed', 'Filtered from primary queue.');
    } catch (err) {
      console.error('Dismiss error:', err);
    }
  };

  const handleRateCommit = async (
    eventId: string,
    grade: 'ready_as_is' | 'light_edits' | 'heavy_edits' | 'unpublishable',
    feedback?: string
  ) => {
    try {
      await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rate_commit', eventId, grade, developerFeedback: feedback }),
      });
      const valRes = await fetch('/api/validation');
      const valData = await valRes.json();
      setValidationData(valData);
      addToast('success', 'Validation Grade Recorded', `Marked as ${grade.replace(/_/g, ' ')}.`);
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  const handleBatchGenerate = async () => {
    setIsBatchGenerating(true);
    try {
      await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch_generate_all' }),
      });
      await loadAllData();
      addToast('success', 'Benchmark Complete', 'All 10 benchmark commits have fresh drafts.');
    } catch (err) {
      console.error('Batch generation error:', err);
      addToast('error', 'Batch Generation Error', 'Please check your connection.');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleResetSeed = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_seed' }),
      });
      await loadAllData();
      addToast('info', 'Database Reset', '10 baseline commits restored.');
    } catch (err) {
      console.error('Reset seed error:', err);
    }
  };

  const handleImportRepo = async (repoUrl: string) => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        addToast('success', 'Repository Connected', `Ingested ${data.importedCount || 'recent'} commits.`);
      } else {
        addToast('error', 'Import Failed', data.error || 'Failed to fetch repo commits.');
      }
    } catch (err) {
      console.error('Import error:', err);
      addToast('error', 'Import Error', 'Connection to GitHub API failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSimulateCommit = async (commitData: any) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commitData),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => [data.event, ...prev]);
        setSelectedEvent(data.event);
        addToast('success', 'Commit Simulated', 'Ingested and scored event.');
        await handleGenerate(data.event.id);
      }
    } catch (err) {
      console.error('Simulate commit error:', err);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<EngineSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        addToast('success', 'Settings Saved', 'Founder voice & model updated.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  // MULTI-SELECTION HANDLERS
  const toggleSelectEvent = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllWorthy = () => {
    const worthyIds = events
      .filter((e) => e.worthiness.score >= 50 && e.status !== 'dismissed')
      .map((e) => e.id);
    setSelectedEventIds(worthyIds);
    addToast('info', 'Worthy Commits Selected', `${worthyIds.length} commits ready for batch action.`);
  };

  const handleDeselectAll = () => {
    setSelectedEventIds([]);
  };

  const handleBatchGenerateSelected = async () => {
    if (selectedEventIds.length === 0) return;
    setIsBatchGenerating(true);
    let count = 0;
    try {
      for (const id of selectedEventIds) {
        await fetch(`/api/events/${id}/generate`, { method: 'POST' });
        count++;
      }
      await loadAllData();
      addToast('success', 'Batch Generation Finished', `Generated drafts for ${count} commits.`);
    } catch (err) {
      console.error('Batch generation error:', err);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleGenerateWeeklyDigest = async () => {
    const targetIds = selectedEventIds.length > 0 ? selectedEventIds : events.filter((e) => e.worthiness.score >= 50).map((e) => e.id);
    if (targetIds.length === 0) {
      addToast('error', 'No Commits Selected', 'Select at least 1 commit to compile a digest.');
      return;
    }

    setIsCompilingDigest(true);
    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: targetIds }),
      });
      const data = await res.json();
      if (data.success) {
        setDigestData(data.digest);
        setIsDigestOpen(true);
        addToast('success', 'Weekly Digest Ready', `Compiled ${data.digest.commitCount} commits into 3 formats.`);
      } else {
        addToast('error', 'Digest Failed', data.error || 'Could not compile digest.');
      }
    } catch (err) {
      console.error('Digest error:', err);
    } finally {
      setIsCompilingDigest(false);
    }
  };

  const handleBatchExportMarkdown = () => {
    const selectedEvents = events.filter((e) => selectedEventIds.includes(e.id));
    if (selectedEvents.length === 0) return;

    let md = `# TCT PostPulse Export — ${new Date().toLocaleDateString()}\n\n`;
    md += `Exported ${selectedEvents.length} commits and their calibrated drafts.\n\n---\n\n`;

    for (const ev of selectedEvents) {
      const evDrafts = drafts.filter((d) => d.eventId === ev.id);
      md += `## [${ev.shortSha}] ${ev.title}\n`;
      md += `**Category**: ${ev.worthiness.category} | **Score**: ${ev.worthiness.score}/100\n`;
      md += `**Repo**: ${ev.repo} | **Date**: ${new Date(ev.timestamp).toLocaleDateString()}\n\n`;

      for (const d of evDrafts) {
        md += `### Format: ${d.platformName}\n`;
        md += `#### ${d.title}\n\n`;
        md += `${d.content}\n\n`;
      }
      md += `\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tct-postpulse-batch-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Markdown Exported', `${selectedEvents.length} commits exported.`);
  };

  const handleBatchDismissSelected = async () => {
    for (const id of selectedEventIds) {
      await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
    }
    setEvents((prev) =>
      prev.map((e) => (selectedEventIds.includes(e.id) ? { ...e, status: 'dismissed' as const } : e))
    );
    setSelectedEventIds([]);
    addToast('info', 'Commits Dismissed', `${selectedEventIds.length} commits marked as dismissed.`);
  };

  // Filtered & Searched events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory !== 'all' && e.worthiness.category !== selectedCategory) {
        return false;
      }
      if (scoreFilter === 'worthy' && e.worthiness.score < 50) {
        return false;
      }
      if (scoreFilter === 'top' && e.worthiness.score < 80) {
        return false;
      }
      if (statusFilter !== 'all') {
        const hasDrafts = drafts.some((d) => d.eventId === e.id);
        const isPublished = drafts.some((d) => d.eventId === e.id && d.publishedUrl) || e.status === 'published';

        if (statusFilter === 'published' && !isPublished) return false;
        if (statusFilter === 'drafted' && (!hasDrafts || isPublished)) return false;
        if (statusFilter === 'pending' && (hasDrafts || e.status === 'dismissed')) return false;
        if (statusFilter === 'dismissed' && e.status !== 'dismissed') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesDesc = (e.description || '').toLowerCase().includes(q);
        const matchesSha = e.shortSha.toLowerCase().includes(q) || e.sha.toLowerCase().includes(q);
        const matchesAuthor = (e.author?.username || '').toLowerCase().includes(q);
        const matchesFile = (e.files || []).some((f) => f.filename.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesSha && !matchesAuthor && !matchesFile) {
          return false;
        }
      }
      return true;
    });
  }, [events, drafts, selectedCategory, scoreFilter, statusFilter, searchQuery]);

  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: 'All Events', icon: Layers },
    { id: 'database_migration', label: 'Migrations', icon: Database },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'bug_war_story', label: 'Bug Stories', icon: Bug },
    { id: 'security_auth', label: 'Security', icon: ShieldCheck },
    { id: 'ui_ux', label: 'UI / UX', icon: Palette },
    { id: 'new_feature', label: 'Features', icon: PackagePlus },
    { id: 'chore_internal', label: 'Chores', icon: Wrench },
  ];

  const worthyCount = events.filter((e) => e.worthiness.score >= 50).length;
  const goldmineCount = events.filter((e) => e.worthiness.score >= 80).length;
  const publishedCount = events.filter((e) => drafts.some((d) => d.eventId === e.id && d.publishedUrl) || e.status === 'published').length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary selection:text-primary-foreground pb-20">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        validationPassed={validationData?.metrics?.thresholdPassed}
        publishableCount={validationData?.metrics?.publishableCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB 1: EVENT FEED */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* COMMAND DASHBOARD HERO BANNER */}
            <Card className="rounded-xl p-6 sm:p-7 relative overflow-hidden border-border bg-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs font-mono font-semibold gap-1.5 border-primary/30 text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Git Content Engine</span>
                    </Badge>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs text-muted-foreground font-medium">Zero Fluff • 100% Engineer Tone</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                    Turn raw git commits into high-engagement developer content
                  </h1>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    TCT PostPulse filters trivial chores, scores post-worthiness, and generates calibrated drafts for{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Reddit r/SideProject</span>,{' '}
                    <span className="text-primary font-medium">Indie Hackers & X</span>, and{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Customer Changelogs</span>.
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleGenerateWeeklyDigest}
                    disabled={isCompilingDigest}
                    className="text-xs font-semibold gap-2 border-primary/40 text-primary"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isCompilingDigest ? 'Compiling...' : 'Weekly Digest'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsSimulateOpen(true)}
                    className="text-xs font-semibold gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-primary" />
                    <span>Simulate Commit</span>
                  </Button>

                  <Button
                    onClick={() => setIsImportOpen(true)}
                    className="text-xs font-bold gap-2 shadow-xs"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>Connect GitHub Repo</span>
                  </Button>
                </div>
              </div>

              {/* 4 MODERN BENTO STATS CARDS */}
              <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                    <span>Monitored Commits</span>
                    <GitCommit className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">{events.length}</div>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {publishedCount} Published Posts
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                    <span>Post-Worthy (≥50)</span>
                    <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-300 font-mono">
                    {worthyCount} <span className="text-xs text-muted-foreground font-sans font-normal">({events.length ? Math.round((worthyCount / events.length) * 100) : 0}%)</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">{goldmineCount} Goldmine Commits</span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                    <span>Drafts Ready</span>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-primary font-mono">{drafts.length}</div>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">Across 3 Formats</span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                    <span>Benchmark Quality</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-300 font-mono">
                    {validationData?.metrics?.publishablePercentage || 100}%
                  </div>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {validationData?.metrics?.publishableCount || 10}/10 Passes Quality Bar
                  </span>
                </div>
              </div>
            </Card>

            {/* UNIFIED SEARCH & FILTER CONTROL BAR */}
            <Card className="rounded-xl p-4 border-border bg-card space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search commits by message, SHA, file, or author (press '/' to focus)..."
                    className="pl-9 pr-9 text-xs font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Score Filter Segmented Control */}
                <div className="flex items-center p-1 rounded-md bg-muted/60 border border-border text-xs flex-shrink-0">
                  <button
                    onClick={() => setScoreFilter('all')}
                    className={`px-3 py-1.5 rounded font-medium transition-all ${
                      scoreFilter === 'all'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Scores
                  </button>
                  <button
                    onClick={() => setScoreFilter('worthy')}
                    className={`px-3 py-1.5 rounded font-medium transition-all ${
                      scoreFilter === 'worthy'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Worthy (≥50)
                  </button>
                  <button
                    onClick={() => setScoreFilter('top')}
                    className={`px-3 py-1.5 rounded font-medium transition-all flex items-center space-x-1 ${
                      scoreFilter === 'top'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Goldmine (≥80)</span>
                  </button>
                </div>

                {/* Status Filter Segmented Control */}
                <div className="flex items-center p-1 rounded-md bg-muted/60 border border-border text-xs flex-shrink-0">
                  {(['all', 'pending', 'drafted', 'published'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded font-medium capitalize transition-all ${
                        statusFilter === st
                          ? 'bg-foreground text-background shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  const count =
                    cat.id === 'all'
                      ? events.length
                      : events.filter((e) => e.worthiness.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all font-medium ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 opacity-80" />
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Multi-Select Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border gap-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllWorthy}
                    className="h-7 text-xs text-primary hover:text-primary/80 gap-1.5 px-2"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Select All Worthy (≥50)</span>
                  </Button>

                  {selectedEventIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      <span>Deselect All ({selectedEventIds.length})</span>
                    </Button>
                  )}
                </div>

                {/* Results status line */}
                <div className="flex items-center space-x-3">
                  <span>
                    Showing <strong>{filteredEvents.length}</strong> of {events.length} commits
                  </span>
                  {(searchQuery || selectedCategory !== 'all' || scoreFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setScoreFilter('all');
                        setStatusFilter('all');
                      }}
                      className="text-primary hover:underline font-semibold"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* EVENT FEED CARDS */}
            {isLoading ? (
              <Card className="rounded-xl p-16 text-center text-muted-foreground font-mono text-xs space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p>Analyzing and indexing Git repository events...</p>
              </Card>
            ) : filteredEvents.length === 0 ? (
              <Card className="rounded-xl p-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">No events matched your criteria</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing your search query or loosening the score and category filters.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setScoreFilter('all');
                    setStatusFilter('all');
                  }}
                  size="sm"
                >
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredEvents.map((event) => {
                  const eventDrafts = drafts.filter((d) => d.eventId === event.id);
                  const isSelected = selectedEventIds.includes(event.id);
                  const publishedDraft = eventDrafts.find((d) => d.publishedUrl);

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      onSelectForStudio={(ev) => {
                        setSelectedEvent(ev);
                        setActiveTab('studio');
                      }}
                      onGenerate={handleGenerate}
                      onDismiss={handleDismiss}
                      isGenerating={isGenerating}
                      draftsCount={eventDrafts.length}
                      isSelected={isSelected}
                      onToggleSelect={toggleSelectEvent}
                      publishedUrl={publishedDraft?.publishedUrl}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DRAFT STUDIO */}
        {activeTab === 'studio' && (
          <DraftStudio
            event={selectedEvent}
            events={events}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            drafts={drafts}
            onUpdateDraft={handleUpdateDraft}
            onRegenerateDraft={handleRegenerateDraft}
            isGenerating={isGenerating}
          />
        )}

        {/* TAB 3: 10-COMMIT VALIDATION BENCHMARK */}
        {activeTab === 'benchmark' && validationData && (
          <ValidationBenchmark
            benchmarkItems={validationData.benchmarkItems || []}
            metrics={validationData.metrics}
            onRateCommit={handleRateCommit}
            onBatchGenerate={handleBatchGenerate}
            onResetSeed={handleResetSeed}
            onSelectEvent={(ev) => {
              setSelectedEvent(ev);
              setActiveTab('studio');
            }}
            isBatchGenerating={isBatchGenerating}
          />
        )}

        {/* TAB 4: SETTINGS SCREEN */}
        {activeTab === 'settings' && settings && (
          <div className="max-w-2xl mx-auto">
            <SettingsModal
              isOpen={true}
              onClose={() => setActiveTab('feed')}
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          </div>
        )}
      </main>

      {/* FLOATING BATCH ACTION TOOLBAR (When 1 or more commits are selected) */}
      {selectedEventIds.length > 0 && activeTab === 'feed' && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto">
          <div className="bg-card border border-primary/40 shadow-2xl rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center space-x-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono font-bold text-foreground">
                {selectedEventIds.length} {selectedEventIds.length === 1 ? 'commit' : 'commits'} selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Generate Weekly Digest */}
              <Button
                size="sm"
                onClick={handleGenerateWeeklyDigest}
                disabled={isCompilingDigest}
                className="text-xs font-bold gap-1.5 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 text-white shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Weekly Digest</span>
              </Button>

              {/* Batch Generate Drafts */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchGenerateSelected}
                disabled={isBatchGenerating}
                className="text-xs font-semibold gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{isBatchGenerating ? 'Generating...' : 'Batch Generate'}</span>
              </Button>

              {/* Batch Export as Markdown */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchExportMarkdown}
                className="text-xs font-semibold gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </Button>

              {/* Batch Dismiss */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBatchDismissSelected}
                className="text-xs text-muted-foreground hover:text-destructive"
                title="Dismiss selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>

              {/* Cancel selection */}
              <button
                type="button"
                onClick={handleDeselectAll}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
                title="Deselect all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modals */}
      <SimulateCommitModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSubmit={handleSimulateCommit}
      />

      <ImportRepoModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        webhookSecret={settings?.githubWebhookSecret || ''}
        onImportRepo={handleImportRepo}
        isImporting={isImporting}
      />

      <WeeklyDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        digest={digestData}
        events={events}
        onNotify={addToast}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {isSettingsOpen && settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/60 py-6 mt-16 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-foreground">TCT PostPulse Engine</span>
            <span>—</span>
            <span>Build-in-Public Content Engine for Indie Hackers</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="hover:text-foreground font-semibold flex items-center space-x-1"
            >
              <Keyboard className="w-3 h-3 text-primary" />
              <span>Shortcuts (?)</span>
            </button>
            <span>•</span>
            <span>Reddit Deep-Dives</span>
            <span>•</span>
            <span>Indie Hackers Stories</span>
            <span>•</span>
            <span>Changelogs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
