"use client";

// Import types separately
import type { ThemeProviderProps } from "next-themes";
import dynamic from "next/dynamic";

// Use dynamic import with ssr: false for the actual ThemeProvider
const NextThemesProvider = dynamic(
  () => import("next-themes").then((mod) => mod.ThemeProvider),
  {
    ssr: false, // Prevent rendering on the server
  }
);

// Your exported component now uses the dynamically imported provider
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Props like attribute, defaultTheme, enableSystem are passed from layout via ...props
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
