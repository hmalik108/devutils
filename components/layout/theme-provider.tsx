"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Theme preference (light/dark/system) is the only thing persisted to localStorage. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="devutils-theme">
      {children}
    </NextThemesProvider>
  );
}
