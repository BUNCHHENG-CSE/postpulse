'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HeadlineVariation, GitEvent } from '@/types';
import { Sparkles, Check, ArrowRight, Zap, Bug, TrendingUp, Heart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ViralHeadlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  headlines: HeadlineVariation[];
  currentTitle: string;
  onSelectHeadline: (headline: string) => void;
  event: GitEvent;
}

export function ViralHeadlinesModal({
  isOpen,
  onClose,
  headlines,
  currentTitle,
  onSelectHeadline,
  event,
}: ViralHeadlinesModalProps) {
  const getAngleBadge = (angle: HeadlineVariation['angle']) => {
    switch (angle) {
      case 'war_story':
        return {
          icon: Bug,
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
        };
      case 'metric':
        return {
          icon: Zap,
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        };
      case 'contrarian':
        return {
          icon: TrendingUp,
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
        };
      case 'vulnerable':
        return {
          icon: Heart,
          color: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
        };
      case 'how_to':
      default:
        return {
          icon: BookOpen,
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-mono">
                Viral Headline & Hook Lab
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pick from 5 battle-tested headline angles tailored to commit <span className="font-mono text-primary font-bold">[{event.shortSha}]</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {headlines.map((item) => {
            const angleMeta = getAngleBadge(item.angle);
            const AngleIcon = angleMeta.icon;
            const isCurrent = currentTitle === item.headline;

            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHeadline(item.headline);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 group ${
                  isCurrent
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono font-semibold gap-1 px-2 py-0.5 rounded-md ${angleMeta.color}`}
                  >
                    <AngleIcon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </Badge>

                  {isCurrent ? (
                    <span className="text-[11px] font-mono text-emerald-500 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active Title</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 font-mono text-primary font-semibold">
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors leading-snug">
                  "{item.headline}"
                </p>

                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  💡 {item.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Selecting any headline replaces the draft title immediately.
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
