'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground opacity-50"
        aria-label="Toggle theme"
      >
        <Moon className="w-4 h-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground transition-transform hover:scale-105"
      title={`Current theme: ${theme || 'system'} (Click to cycle Light / Dark / System)`}
      aria-label="Toggle theme"
    >
      {theme === 'system' ? (
        <Laptop className="w-4 h-4 text-primary" />
      ) : isDark ? (
        <Moon className="w-4 h-4 text-primary" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
    </Button>
  );
}
