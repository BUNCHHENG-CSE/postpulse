'use client';

import React, { useState } from 'react';
import { EngineSettings } from '@/types';
import { X, Sliders, Key, Save, Check, Shield, User, Bot } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (settings: Partial<EngineSettings>) => Promise<void>;
}

export function SettingsModal({ isOpen, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [form, setForm] = useState<EngineSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveSettings(form);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
          <Sliders className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-100">Engine & Voice Calibration Settings</h3>
        </div>

        <p className="text-xs text-slate-400 mb-5">
          Tune your developer persona, product context, and LLM preferences so drafts sound like YOU.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Product Context */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Product & Persona Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Product One-Liner / Tagline</label>
              <input
                type="text"
                value={form.productTagline}
                onChange={(e) => setForm({ ...form, productTagline: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Founder Voice & Tone Calibration (Crucial for authentic posts)
              </label>
              <textarea
                rows={2}
                value={form.founderVoiceBio}
                onChange={(e) => setForm({ ...form, founderVoiceBio: e.target.value })}
                placeholder="e.g. Solo backend engineer building a B2B SaaS. Direct, blunt, pragmatic, zero marketing fluff, shares numbers."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: LLM Configuration */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Provider & API Keys (Optional)</span>
            </div>

            <p className="text-[11px] text-slate-400">
              PostPulse includes a <strong>Built-In Calibrated Developer Engine</strong> that works out of the box with zero external keys.
              You can also configure your own OpenAI, Anthropic, or Gemini API keys below.
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  OpenAI API Key (e.g. gpt-4o-mini)
                </label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={form.openaiApiKey || ''}
                  onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Anthropic API Key (e.g. claude-3-5-sonnet)
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={form.anthropicApiKey || ''}
                  onChange={(e) => setForm({ ...form, anthropicApiKey: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Google Gemini API Key (e.g. gemini-1.5-flash)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={form.geminiApiKey || ''}
                  onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Webhook & Filtering Preferences */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ingestion & Noise Threshold</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Minimum Post-Worthiness Score to Draft:</span>
                <span className="font-mono font-bold text-indigo-400">{form.minScoreToDraft}/100</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                value={form.minScoreToDraft}
                onChange={(e) => setForm({ ...form, minScoreToDraft: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Commits scoring below {form.minScoreToDraft} (like minor typos or lockfile updates) won't trigger drafts.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="autoDraft"
                checked={form.autoDraftOnWebhook}
                onChange={(e) => setForm({ ...form, autoDraftOnWebhook: e.target.checked })}
                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="autoDraft" className="text-xs text-slate-300 cursor-pointer">
                Automatically generate all 3 drafts when a webhook event arrives
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
