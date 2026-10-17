'use client';

import React from 'react';
import { GitCommit, Sparkles, Sliders, CheckCircle2, PlusCircle } from 'lucide-react';
import { GithubIcon } from './Icons';

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
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <GitCommit className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 tracking-tight text-lg">POSTPULSE</span>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                  Git → Drafts
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Build-in-Public Content Engine for Indie Hackers</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Event Feed
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'studio'
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Draft Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'benchmark'
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  validationPassed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span>Validation Benchmark</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  validationPassed
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {publishableCount}/10
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all ${
                activeTab === 'settings' ? 'bg-slate-800 text-white border border-slate-700' : ''
              }`}
              title="Voice Settings & Calibration"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSimulate}
              className="hidden md:flex items-center space-x-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Simulate Commit</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Connect Repo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
