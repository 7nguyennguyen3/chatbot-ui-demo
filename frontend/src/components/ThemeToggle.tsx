"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { TooltipIconButton } from "@/components/ui/custom-tooltip"; // Import TooltipIconButton

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Placeholder while not mounted
  if (!mounted) {
    return (
      <TooltipIconButton
        tooltip="Loading theme..."
        disabled
        className="shadow-none bg-transparent text-gray-400 w-10 h-10" // Consistent size
      >
        <Sun className="scale-[140%] sm:scale-150 xl:scale-[170%] rotate-0 transition-all" />
      </TooltipIconButton>
    );
  }

  // Determine current tooltip text
  const tooltipText =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <TooltipIconButton
      tooltip={tooltipText}
      onClick={toggleTheme}
      // Apply theme-aware styling similar to the previous button/other icons
      className="shadow-none bg-transparent text-foreground hover:bg-accent hover:scale-110 transition-transform duration-200 w-10 h-10"
      aria-label="Toggle theme" // Keep aria-label for accessibility
    >
      {theme === "dark" ? (
        <Sun className="scale-[140%] sm:scale-150 xl:scale-[170%] rotate-90 transition-all dark:rotate-0" />
      ) : (
        <Moon className="scale-[140%] sm:scale-150 xl:scale-[170%] rotate-0 transition-all dark:-rotate-90" /> // Simplified dark mode animation
      )}
    </TooltipIconButton>
  );
}
