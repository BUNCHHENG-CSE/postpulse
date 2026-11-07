'use client';

import React, { useState, useEffect } from 'react';
import { EngineSettings } from '@/types';
import {
  X,
  Sliders,
  Save,
  Check,
  Shield,
  User,
  Bot,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  Sparkles,
  Key,
  GitBranch,
  Zap,
  CheckCheck,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (settings: Partial<EngineSettings>) => Promise<void>;
}

type TabKey = 'persona' | 'llm' | 'ingestion';

const VOICE_PRESETS = [
  {
    id: 'no-nonsense',
    label: '🛠️ Pragmatic Engineer',
    bio: 'Solo developer, ex-infrastructure engineer, no-nonsense technical tone with zero marketing hype.',
    tagline: 'Turn your git commits into viral developer content automatically',
    sampleHook:
      'Rewrote our Redis indexing layer after cascade locks spiked latency to 850ms. Here is the bottleneck we identified and why adding a partial index fixed it without upgrading hardware.',
  },
  {
    id: 'bootstrapper',
    label: '🚀 Open Bootstrapper',
    bio: 'Bootstrapped solo founder building in public. Candidly sharing real MRR, churn metrics, architectural mistakes, and raw lessons.',
    tagline: 'The developer-first content engine for technical founders',
    sampleHook:
      'Almost lost 4 enterprise renewals this week due to webhook timeout cascades. Here are the 3 architectural guardrails we shipped to survive 10x traffic spikes.',
  },
  {
    id: 'architect',
    label: '🧠 Systems Architect',
    bio: 'Staff engineer breaking down distributed systems trade-offs, concurrency bugs, and production war stories with code snippets.',
    tagline: 'Transform git commits into high-signal engineering essays',
    sampleHook:
      'Why we chose optimistic concurrency over distributed mutexes in our multi-tenant event pipeline. A breakdown of failure modes and benchmark comparisons.',
  },
  {
    id: 'ship-fast',
    label: '⚡ High-Velocity Builder',
    bio: 'High-velocity product engineer shipping daily. Unfiltered build logs, rapid MVP validation, pragmatic trade-offs, zero fluff.',
    tagline: 'Automated developer content straight from your git push',
    sampleHook:
      'Shipped 4 major features this weekend by ruthlessly pruning nice-to-haves. Here is what we cut, what made the MVP, and how our first 200 users reacted.',
  },
];

const MODEL_OPTIONS = [
  {
    id: 'builtin',
    name: 'Built-In Developer Engine',
    desc: 'Deterministic, offline, zero-key engine. Free & instant fallback.',
    badge: 'Offline / Free',
    provider: 'Built-in',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o-mini',
    desc: 'Fast, cost-effective, and highly structured for technical post formats.',
    badge: 'Fast & Cheap',
    provider: 'OpenAI',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    desc: 'Deep reasoning and high-punch storytelling for viral build-in-public posts.',
    badge: 'Flagship',
    provider: 'OpenAI',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Anthropic Claude 3.5 Sonnet',
    desc: 'Top developer community favorite for authentic, non-cringe founder voice.',
    badge: 'Top Developer Voice',
    provider: 'Anthropic',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Google Gemini 1.5 Flash',
    desc: 'Sub-second latency with 1M context window for massive multi-file diffs.',
    badge: 'Sub-second',
    provider: 'Google',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Google Gemini 1.5 Pro',
    desc: 'State-of-the-art multi-file code understanding and architectural synthesis.',
    badge: 'Deep Code',
    provider: 'Google',
  },
];

const DEFAULT_SETTINGS_FALLBACK: EngineSettings = {
  productName: 'TCT PostPulse',
  productTagline: 'Turn your git commits into viral developer content automatically',
  targetAudience: 'Indie hackers, micro-SaaS founders, and full-stack software engineers',
  founderVoiceBio: 'Solo developer, ex-infrastructure engineer, no-nonsense technical tone with zero marketing hype',
  repoUrl: 'https://github.com/developer/tct-postpulse',
  githubWebhookSecret: 'dev_secret_content_engine_123',
  githubToken: '',
  preferredModel: 'gpt-4o-mini',
  minScoreToDraft: 50,
  autoDraftOnWebhook: true,
};

export function SettingsModal({ isOpen, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('persona');
  const [form, setForm] = useState<EngineSettings>(settings || DEFAULT_SETTINGS_FALLBACK);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync state if incoming settings change
  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  // Keyboard shortcut: Escape to close, Ctrl+S / Cmd+S to save
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, form]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await onSaveSettings(form);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1100);
  };

  const handleResetToDefaults = () => {
    setForm(DEFAULT_SETTINGS_FALLBACK);
    setShowResetConfirm(false);
  };

  const handleCopyWebhookUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    navigator.clipboard.writeText(`${origin}/api/webhooks/github`);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  const handleCopySecret = () => {
    if (form.githubWebhookSecret) {
      navigator.clipboard.writeText(form.githubWebhookSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const getScoreDescription = (score: number) => {
    if (score < 40) {
      return {
        label: 'Permissive / High Volume',
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        desc: 'Drafts triggered for almost all commits, including formatting and dependency bumps.',
      };
    }
    if (score <= 65) {
      return {
        label: 'Balanced (Recommended)',
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        desc: 'Filters routine noise (lockfiles, minor typos) while capturing meaningful features, fixes, and refactors.',
      };
    }
    return {
      label: 'Strict / High-Signal Only',
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      desc: 'Only major architectural changes, breaking releases, or high-impact commits trigger automated drafts.',
    };
  };

  const scoreInfo = getScoreDescription(form.minScoreToDraft);

  // Active sample hook based on selected preset or customized text
  const currentSampleHook =
    VOICE_PRESETS.find((p) => p.bio === form.founderVoiceBio)?.sampleHook ||
    `[${form.productName || 'App'}] Shipped a refactor to eliminate database timeouts under concurrent load. Here is the exact query bottleneck and why we chose a partial index over scaling hardware:`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="border-border rounded-2xl max-w-2xl w-full shadow-2xl relative bg-card flex flex-col max-h-[92vh] overflow-hidden border border-border/80">
        {/* MODAL HEADER */}
        <div className="px-5 pt-5 pb-3 border-b border-border/70 flex items-start justify-between bg-muted/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Engine & Voice Calibration
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                  v1.2
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tune your developer persona, product context, and LLM preferences for authentic drafts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center space-x-1 px-5 pt-3 bg-muted/10 border-b border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === 'persona'
                ? 'border-primary text-primary bg-background shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Persona & Brand</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('llm')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === 'llm'
                ? 'border-primary text-primary bg-background shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Models & Keys</span>
            {(form.openaiApiKey || form.anthropicApiKey || form.geminiApiKey) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === 'ingestion'
                ? 'border-primary text-primary bg-background shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Ingestion & Rules</span>
          </button>
        </div>

        {/* TAB CONTENT (Scrollable Area) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* TAB 1: PERSONA & BRAND PROFILE */}
          {activeTab === 'persona' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Product Name</label>
                  <Input
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="e.g. PostPulse"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Used as the context anchor in changelogs & stories.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Audience</label>
                  <Input
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    placeholder="e.g. Indie hackers, backend engineers"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Calibrates technical depth and pain points.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Product One-Liner / Value Proposition
                </label>
                <Input
                  value={form.productTagline}
                  onChange={(e) => setForm({ ...form, productTagline: e.target.value })}
                  placeholder="e.g. Turn your git commits into viral developer content automatically"
                  className="text-xs"
                />
              </div>

              {/* FOUNDER VOICE BIO WITH 1-CLICK PRESETS */}
              <div className="space-y-2 p-3.5 bg-muted/30 rounded-xl border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <label className="text-xs font-bold text-foreground">
                      Founder Voice Bio & Calibration
                    </label>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Select a tone preset:</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {VOICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          founderVoiceBio: preset.bio,
                          productTagline: form.productTagline || preset.tagline,
                        })
                      }
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                        form.founderVoiceBio === preset.bio
                          ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                          : 'bg-background hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Textarea
                  rows={3}
                  value={form.founderVoiceBio}
                  onChange={(e) => setForm({ ...form, founderVoiceBio: e.target.value })}
                  placeholder="e.g. Solo backend engineer building a B2B SaaS. Direct, blunt, pragmatic, zero marketing fluff, shares real numbers."
                  className="text-xs resize-none leading-relaxed mt-2"
                />
                <p className="text-[11px] text-muted-foreground">
                  The LLM adapts vocabulary, skepticism, humor, and metric transparency to match this exact bio.
                </p>
              </div>

              {/* LIVE VOICE PREVIEW CARD */}
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-primary">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Live Voice Calibration Preview</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                    Sample Output
                  </Badge>
                </div>
                <p className="text-xs text-foreground/90 italic font-mono bg-background/60 p-2.5 rounded-lg border border-border/50">
                  &ldquo;{currentSampleHook}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AI PROVIDER & API KEYS */}
          {activeTab === 'llm' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* MODEL SELECTOR */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Preferred AI Model for Generation
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODEL_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setForm({ ...form, preferredModel: opt.id })}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        form.preferredModel === opt.id
                          ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                          : 'bg-muted/30 border-border hover:border-border/80 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{opt.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${
                            form.preferredModel === opt.id
                              ? 'border-primary/40 text-primary bg-primary/10'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {opt.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* API KEYS SECTION */}
              <div className="space-y-3 p-3.5 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                    <Key className="w-3.5 h-3.5 text-primary" />
                    <span>Custom API Keys (Optional)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Stored Locally
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Leave blank to use the free <strong>Built-In Developer Engine</strong>. Providing your own key unlocks frontier LLM reasoning.
                </p>

                {/* OpenAI Key */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      OpenAI API Key
                    </label>
                    {form.openaiApiKey ? (
                      <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
                        ● Configured
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Optional</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showOpenAIKey ? 'text' : 'password'}
                      placeholder="sk-proj-..."
                      value={form.openaiApiKey || ''}
                      onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                      className="text-xs font-mono pr-16"
                    />
                    <div className="absolute right-1.5 flex items-center space-x-1">
                      {form.openaiApiKey && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, openaiApiKey: '' })}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Clear Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title={showOpenAIKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showOpenAIKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Anthropic Key */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Anthropic API Key
                    </label>
                    {form.anthropicApiKey ? (
                      <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
                        ● Configured
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Optional</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showAnthropicKey ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={form.anthropicApiKey || ''}
                      onChange={(e) => setForm({ ...form, anthropicApiKey: e.target.value })}
                      className="text-xs font-mono pr-16"
                    />
                    <div className="absolute right-1.5 flex items-center space-x-1">
                      {form.anthropicApiKey && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, anthropicApiKey: '' })}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Clear Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title={showAnthropicKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showAnthropicKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gemini Key */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Google Gemini API Key
                    </label>
                    {form.geminiApiKey ? (
                      <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
                        ● Configured
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Optional</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showGeminiKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={form.geminiApiKey || ''}
                      onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                      className="text-xs font-mono pr-16"
                    />
                    <div className="absolute right-1.5 flex items-center space-x-1">
                      {form.geminiApiKey && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, geminiApiKey: '' })}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Clear Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title={showGeminiKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INGESTION & RULES */}
          {activeTab === 'ingestion' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* POST-WORTHINESS SLIDER */}
              <div className="space-y-3 p-3.5 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Minimum Post-Worthiness Score to Draft</span>
                  </div>
                  <Badge variant="outline" className={`font-mono font-bold text-xs ${scoreInfo.color}`}>
                    {form.minScoreToDraft}/100
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={form.minScoreToDraft}
                    onChange={(e) => setForm({ ...form, minScoreToDraft: Number(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>20 (Permissive)</span>
                    <span className="font-bold text-primary">50 (Recommended)</span>
                    <span>90 (Strict)</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs ${scoreInfo.color}`}>
                  <span className="font-bold block mb-0.5">{scoreInfo.label}</span>
                  <p className="text-[11px] opacity-90 leading-relaxed">{scoreInfo.desc}</p>
                </div>
              </div>

              {/* AUTOMATION CHECKBOX */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="autoDraft"
                    checked={form.autoDraftOnWebhook}
                    onChange={(e) => setForm({ ...form, autoDraftOnWebhook: e.target.checked })}
                    className="mt-0.5 rounded bg-card border-border text-primary focus:ring-0 cursor-pointer h-4 w-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-foreground block">
                      Auto-generate drafts on webhook events
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      When enabled, inbound commits meeting the threshold score will immediately trigger generation for Reddit, Indie Hackers, and Changelog formats.
                    </span>
                  </div>
                </label>
              </div>

              {/* GIT REPO & WEBHOOKS */}
              <div className="space-y-3 p-3.5 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-foreground">
                  <GitBranch className="w-3.5 h-3.5 text-primary" />
                  <span>Repository & GitHub Webhook</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    GitHub Repository URL
                  </label>
                  <Input
                    value={form.repoUrl || ''}
                    onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                    placeholder="https://github.com/org/repo"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Webhook Secret
                    </label>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-[10px] text-primary hover:underline flex items-center space-x-1"
                    >
                      {copiedSecret ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy Secret'}</span>
                    </button>
                  </div>
                  <Input
                    type="password"
                    value={form.githubWebhookSecret || ''}
                    onChange={(e) => setForm({ ...form, githubWebhookSecret: e.target.value })}
                    placeholder="dev_secret_..."
                    className="text-xs font-mono"
                  />
                </div>

                {/* Webhook Endpoint Guide */}
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Webhook Payload URL
                    </span>
                    <code className="text-[11px] font-mono text-primary truncate block">
                      /api/webhooks/github
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleCopyWebhookUrl}
                    className="shrink-0 gap-1 text-[10px]"
                  >
                    {copiedWebhookUrl ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STICKY MODAL FOOTER */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2 bg-card sticky bottom-0">
            {showResetConfirm ? (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-destructive font-medium">Reset all to default?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  onClick={handleResetToDefaults}
                  className="text-[10px] font-bold"
                >
                  Yes, Reset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowResetConfirm(false)}
                  className="text-[10px]"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </Button>
            )}

            <div className="flex items-center space-x-2">
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
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs font-bold gap-1.5 min-w-[120px] shadow-sm"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
