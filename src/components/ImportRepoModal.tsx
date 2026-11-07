'use client';

import React, { useState } from 'react';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import { GithubIcon } from './Icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <Card className="border-border rounded-xl max-w-xl w-full p-6 shadow-xl relative bg-card">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-primary mb-1.5">
          <GithubIcon className="w-5 h-5" />
          <h3 className="text-lg font-bold text-foreground tracking-tight">Connect GitHub Repository</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Connect your GitHub repository to stream commits and releases directly into the engine.
        </p>

        {/* Tab switch */}
        <div className="flex bg-muted/60 border border-border rounded-md p-1 text-xs mb-4">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded font-semibold transition-all ${
              activeTab === 'import' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Import Commits via GitHub API
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex-1 py-1.5 rounded font-semibold transition-all ${
              activeTab === 'webhook' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Real-Time GitHub Webhook
          </button>
        </div>

        {activeTab === 'import' ? (
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                GitHub Repository URL or Owner/Repo
              </label>
              <Input
                required
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g. facebook/react or vercel/next.js or your-username/your-repo"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Fetches the latest commits with full file diff churn and classifies their post-worthiness immediately.
              </p>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-lg border border-border text-xs text-muted-foreground space-y-2">
              <span className="font-semibold text-foreground block">Quick Examples to Try:</span>
              <div className="flex flex-wrap gap-2">
                {['shadcn-ui/ui', 'tailwindlabs/tailwindcss', 'supabase/supabase'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setRepoInput(sample)}
                    className="font-mono text-[11px] text-primary bg-card border border-border hover:border-primary/40 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
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
                type="submit"
                size="sm"
                disabled={isImporting || !repoInput}
                className="text-xs font-bold gap-1.5 shadow-xs"
              >
                <span>{isImporting ? 'Fetching Commits...' : 'Import Commits Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                1. Webhook Payload URL
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-xs select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleCopy(webhookUrl, 'url')}
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                2. Webhook Secret (HMAC-SHA256)
              </label>
              <Input
                readOnly
                value={webhookSecret || 'dev_secret_content_engine_123'}
                className="font-mono text-xs text-muted-foreground select-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-foreground">
                  3. Test via cURL Terminal Command:
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(curlExample, 'curl')}
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center space-x-1"
                >
                  {copiedCurl ? <span>Copied!</span> : <span>Copy cURL</span>}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-foreground bg-muted/40 p-3 rounded-lg border border-border overflow-x-auto max-h-28">
                <code>{curlExample}</code>
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
