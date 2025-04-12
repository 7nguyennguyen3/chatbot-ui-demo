"use client";

import { TooltipIconButton } from "@/components/ui/custom-tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useThreads } from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PanelLeftOpen, Lightbulb, SquarePen } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import React from "react";

interface TopBarProps {
  setOpenTutorial: (open: boolean) => void;
  setThreadId: (threadId: string) => void;
  userId: string | null;
}

const TopBar = ({ userId, setOpenTutorial, setThreadId }: TopBarProps) => {
  const [sidebarOpen, setSideBarOpen] = useQueryState(
    "sidebarOpen",
    parseAsBoolean.withDefault(false)
  );
  const { createThread } = useThreads(userId ?? undefined);
  const isXLargeScreen = useMediaQuery("(min-width: 1280px)");
  const sidebarWidth = isXLargeScreen ? 400 : 300;

  return (
    <motion.nav
      initial={false}
      animate={{
        paddingLeft: sidebarOpen ? `${sidebarWidth}px` : "0px",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      }}
      className={cn(
        "fixed top-0 left-0 right-0 w-full px-5 py-3 z-50 backdrop-blur-md shadow-sm",
        "bg-white/90 dark:bg-[var(--background)/0.9]" // <-- ADD DARK MODE BACKGROUND
      )}
    >
      <motion.div
        className={cn(
          "flex items-center justify-between w-full max-w-3xl xl:max-w-4xl mx-auto",
          sidebarOpen && "justify-end"
        )}
      >
        <Button
          className={cn(
            "shadow-none bg-transparent hover:scale-110 transition-transform duration-200",
            "text-black dark:text-white", // <-- ADD DARK MODE TEXT
            "hover:bg-gray-100 dark:hover:bg-gray-800", // <-- ADD DARK MODE HOVER BG
            sidebarOpen ? "hidden" : "flex"
          )}
          onClick={() => setSideBarOpen(!sidebarOpen)}
        >
          <PanelLeftOpen className="scale-[140%] sm:scale-150 xl:scale-[170%]" />
        </Button>
        {/* Group the right-side icons */}
        <div className="flex items-center gap-2">
          {" "}
          {/* Add a gap if needed */}
          <TooltipIconButton
            tooltip="Open tutorial"
            onClick={() => setOpenTutorial(true)}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Lightbulb className="scale-[140%] sm:scale-150 xl:scale-[170%]" />
          </TooltipIconButton>
          <TooltipIconButton
            tooltip="New chat"
            onClick={async () => {
              const thread = await createThread(userId ?? "");
              if (thread) {
                setThreadId(thread.thread_id);
              }
            }}
            // Add dark mode styling if TooltipIconButton doesn't inherit properly
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <SquarePen className="scale-[140%] sm:scale-150 xl:scale-[170%]" />
          </TooltipIconButton>
          <ThemeToggle /> {/* <-- ADD THE THEME TOGGLE BUTTON HERE */}
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default TopBar;
