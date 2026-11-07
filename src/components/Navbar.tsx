'use client';

import React from 'react';
import { GitCommit, Sparkles, Sliders, CheckCircle2, Terminal, Radio } from 'lucide-react';
import { GithubIcon } from './Icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavbarProps {
  activeTab: 'feed' | 'studio' | 'benchmark' | 'settings';
  setActiveTab: (tab: 'feed' | 'studio' | 'benchmark' | 'settings') => void;
  onOpenSimulate: () => void;
  onOpenImport: () => void;
  validationPassed?: boolean;
  publishableCount?: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenSimulate,
  onOpenImport,
  validationPassed,
  publishableCount = 5,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none"
            onClick={() => setActiveTab('feed')}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 via-primary to-cyan-400 p-[1px] shadow-sm shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
                <div className="w-full h-full bg-background rounded-[7px] flex items-center justify-center">
                  <GitCommit className="w-4 h-4 text-primary group-hover:text-cyan-300 transition-colors" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-foreground">
                  TCT POSTPULSE
                </span>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono uppercase gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>v1.2 Engine</span>
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden md:block">
                Git Commits <span className="opacity-50">→</span> Publishable Developer Content
              </p>
            </div>
          </div>

          {/* Segmented Navigation Bar */}
          <nav className="flex items-center p-1 rounded-lg bg-muted/60 border border-border shadow-xs">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeTab === 'feed'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Radio className="w-3.5 h-3.5 opacity-80" />
              <span>Event Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeTab === 'studio'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 opacity-80" />
              <span>Draft Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                activeTab === 'benchmark'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  validationPassed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span className="hidden sm:inline">Validation</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                  validationPassed
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {publishableCount}/10
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${
                activeTab === 'settings' ? 'bg-primary text-primary-foreground shadow-xs' : ''
              }`}
              title="Voice Settings & Calibration"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSimulate}
              className="hidden lg:inline-flex text-xs font-medium"
            >
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>Simulate Commit</span>
            </Button>

            <Button
              size="sm"
              onClick={onOpenImport}
              className="text-xs font-semibold shadow-xs"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Connect Repo</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
