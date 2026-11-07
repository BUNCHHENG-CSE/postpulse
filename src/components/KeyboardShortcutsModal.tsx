'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard, ArrowUpDown, Sparkles, Copy, FileText, CheckSquare, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    {
      key: '?',
      description: 'Open this Keyboard Shortcuts cheat sheet',
      category: 'General',
      icon: Keyboard,
    },
    {
      key: '1 / 2 / 3',
      description: 'Switch between Technical Lesson, Founder Story, and Changelog in Studio',
      category: 'Draft Studio',
      icon: FileText,
    },
    {
      key: 'J / K',
      description: 'Navigate to next / previous commit in Feed or Studio',
      category: 'Navigation',
      icon: ArrowUpDown,
    },
    {
      key: 'Ctrl / Cmd + C',
      description: 'Quick-copy active draft to clipboard in Draft Studio',
      category: 'Draft Studio',
      icon: Copy,
    },
    {
      key: 'Ctrl / Cmd + S',
      description: 'Save edited draft changes immediately',
      category: 'Draft Studio',
      icon: CheckSquare,
    },
    {
      key: '/',
      description: 'Focus commit search input on feed',
      category: 'Event Feed',
      icon: Search,
    },
    {
      key: 'Esc',
      description: 'Close active modal or drawer',
      category: 'General',
      icon: Keyboard,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-mono">Keyboard Shortcuts</DialogTitle>
              <DialogDescription className="text-xs">
                Speed up your build-in-public workflow with instant hotkeys.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2.5 mt-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
            >
              <span className="text-muted-foreground">{sc.description}</span>
              <kbd className="px-2 py-1 rounded bg-card border border-border text-[11px] font-mono font-bold text-foreground shadow-xs shrink-0 ml-3">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Pro tip: Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono">?</kbd> anywhere to toggle this guide.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
