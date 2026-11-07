import type { Metadata } from 'next';
import './globals.css';
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'TCT PostPulse — Build-in-Public Content Engine for Indie Developers',
  description: 'Translate your Git commits and releases into publishable Reddit deep-dives, Indie Hackers updates, and clean changelogs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-mono", jetbrainsMono.variable)}>
      <body className="bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground font-mono transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
