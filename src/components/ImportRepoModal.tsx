'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, ArrowRight } from 'lucide-react';
import { GithubIcon } from './Icons';

interface ImportRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookSecret: string;
  onImportRepo: (repoUrl: string) => Promise<void>;
  isImporting?: boolean;
}

export function ImportRepoModal({
  isOpen,
  onClose,
  webhookSecret,
  onImportRepo,
  isImporting,
}: ImportRepoModalProps) {
  const [repoInput, setRepoInput] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'webhook'>('import');

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookUrl = `${currentHost}/api/webhooks/github`;

  const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-github-event: push" \\
  -d '{"repository":{"full_name":"my-org/my-saas"},"commits":[{"id":"7f2b1a9c","message":"perf(db): add partial index to reduce lock contention","added":[],"modified":["schema.prisma","queries.ts"],"removed":[]}]}'`;

  const handleCopy = (text: string, type: 'url' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput) return;
    await onImportRepo(repoInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
          <GithubIcon className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-100">Connect GitHub Repository</h3>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Connect your GitHub repository to stream commits and releases directly into the engine.
        </p>

        {/* Tab switch */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs mb-4">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Import Commits via GitHub API
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'webhook' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Real-Time GitHub Webhook Setup
          </button>
        </div>

        {activeTab === 'import' ? (
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                GitHub Repository URL or Owner/Repo
              </label>
              <input
                type="text"
                required
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g. facebook/react or vercel/next.js or your-username/your-repo"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Fetches the latest 10 commits with full file diff churn and classifies their post-worthiness immediately.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Quick Examples to Try:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {['shadcn-ui/ui', 'tailwindlabs/tailwindcss', 'supabase/supabase'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setRepoInput(sample)}
                    className="font-mono text-[11px] text-indigo-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded hover:bg-slate-800"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

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
                disabled={isImporting || !repoInput}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <span>{isImporting ? 'Fetching Commits...' : 'Import Commits Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                1. Webhook Payload URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrl, 'url')}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-200 border border-slate-700"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                2. Webhook Secret (HMAC-SHA256)
              </label>
              <input
                type="text"
                readOnly
                value={webhookSecret || 'dev_secret_content_engine_123'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-400 select-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  3. Test via cURL Terminal Command:
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(curlExample, 'curl')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  {copiedCurl ? <span>Copied!</span> : <span>Copy cURL</span>}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto max-h-28">
                <code>{curlExample}</code>
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
