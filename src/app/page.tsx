'use client';

import React, { useState, useEffect } from 'react';
import { GitEvent, ContentDraft, EngineSettings } from '@/types';
import { Navbar } from '@/components/Navbar';
import { EventCard } from '@/components/EventCard';
import { DraftStudio } from '@/components/DraftStudio';
import { ValidationBenchmark } from '@/components/ValidationBenchmark';
import { SimulateCommitModal } from '@/components/SimulateCommitModal';
import { ImportRepoModal } from '@/components/ImportRepoModal';
import { SettingsModal } from '@/components/SettingsModal';
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
} from 'lucide-react';
import { GithubIcon } from '@/components/Icons';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'feed' | 'studio' | 'benchmark' | 'settings'>('feed');
  const [events, setEvents] = useState<GitEvent[]>([]);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [settings, setSettings] = useState<EngineSettings | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GitEvent | null>(null);
  const [validationData, setValidationData] = useState<any>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'worthy' | 'top'>('all');

  // Modals
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

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
        // Refresh drafts and events
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
        const draftsRes = await fetch('/api/drafts');
        const dJson = await draftsRes.json();
        setDrafts(dJson.drafts || []);
      }
    } catch (err) {
      console.error('Failed to regenerate draft:', err);
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
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      }
    } catch (err) {
      console.error('Failed to update draft:', err);
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
    } catch (err) {
      console.error('Batch generation error:', err);
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
      } else {
        alert(`Import note: ${data.error}`);
      }
    } catch (err) {
      console.error('Import error:', err);
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
        // Automatically generate drafts for simulated commit
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
      }
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  // Filtered events
  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'all' && e.worthiness.category !== selectedCategory) {
      return false;
    }
    if (scoreFilter === 'worthy' && e.worthiness.score < 50) {
      return false;
    }
    if (scoreFilter === 'top' && e.worthiness.score < 80) {
      return false;
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'All Events' },
    { id: 'database_migration', label: 'Database Migrations' },
    { id: 'performance', label: 'Performance' },
    { id: 'bug_war_story', label: 'Bug War Stories' },
    { id: 'security_auth', label: 'Security & Auth' },
    { id: 'ui_ux', label: 'UI / UX Polish' },
    { id: 'new_feature', label: 'New Features' },
    { id: 'chore_internal', label: 'Chores & Internal' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
            {/* Hero / Value Banner */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                      Git Events → Publishable Content
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">Zero Corporate Fluff</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                    Translate your daily code commits into authentic developer content
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Filters out trivial chores, scores post-worthiness, and generates three tailored formats:
                    a <strong className="text-slate-200">Technical Lesson</strong> for Reddit, a{' '}
                    <strong className="text-slate-200">Build-in-Public Story</strong> for Indie Hackers & LinkedIn, and a{' '}
                    <strong className="text-slate-200">Changelog Entry</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setIsSimulateOpen(true)}
                    className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg font-medium transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Simulate Custom Commit</span>
                  </button>
                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg font-semibold shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>Connect GitHub Repo</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics Strip */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Monitored Commits</span>
                  <span className="text-base font-bold text-slate-100 font-mono">{events.length}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Drafts Ready</span>
                  <span className="text-base font-bold text-indigo-400 font-mono">{drafts.length}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Post-Worthy (&gt;50)</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {events.filter((e) => e.worthiness.score >= 50).length}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px]">Validation Pass Rate</span>
                  <span className="text-base font-bold text-cyan-400 font-mono">
                    {validationData?.metrics?.publishablePercentage || 100}%
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 flex-shrink-0" />
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-slate-800 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Worthiness Score Filter */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-shrink-0">
                <button
                  onClick={() => setScoreFilter('all')}
                  className={`px-2 py-0.5 rounded ${
                    scoreFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setScoreFilter('worthy')}
                  className={`px-2 py-0.5 rounded ${
                    scoreFilter === 'worthy' ? 'bg-slate-800 text-indigo-300 font-medium' : 'text-slate-400'
                  }`}
                >
                  Worthy (≥50)
                </button>
                <button
                  onClick={() => setScoreFilter('top')}
                  className={`px-2 py-0.5 rounded flex items-center space-x-1 ${
                    scoreFilter === 'top' ? 'bg-emerald-950 text-emerald-300 font-medium border border-emerald-500/20' : 'text-slate-400'
                  }`}
                >
                  <Flame className="w-3 h-3 text-emerald-400" />
                  <span>Goldmine (≥80)</span>
                </button>
              </div>
            </div>

            {/* Events List */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 font-mono text-sm">
                Loading git events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/20 space-y-3">
                <p className="text-slate-400 text-sm">No git events match the selected filters.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setScoreFilter('all');
                  }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredEvents.map((event) => {
                  const eventDrafts = drafts.filter((d) => d.eventId === event.id);
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

      {isSettingsOpen && settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">PostPulse Engine</span>
            <span>—</span>
            <span>Git Events → Publishable Content</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Reddit Deep-Dives</span>
            <span>•</span>
            <span>Indie Hackers Stories</span>
            <span>•</span>
            <span>Product Changelogs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
