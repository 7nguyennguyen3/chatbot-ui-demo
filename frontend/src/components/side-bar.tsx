"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useThreads } from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MessageSquare, PanelLeftClose } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect } from "react";

const SideBar = ({ userId }: { userId: string }) => {
  const { getUserThreads, userThreads, isUserThreadsLoading } =
    useThreads(userId);
  const [threadId, setThreadId] = useQueryState("threadId");
  const [sidebarOpen, setSideBarOpen] = useQueryState(
    "sidebarOpen",
    parseAsBoolean.withDefault(false)
  );

  const isXLargeScreen = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (userId) {
      getUserThreads(userId);
    }
  }, [userId]);

  return (
    <motion.div
      className="fixed top-0 left-0 h-full bg-white dark:bg-[var(--background)/0.9] border-r z-[999] shadow-lg"
      initial={{ x: -400 }}
      animate={{
        x: sidebarOpen ? 0 : -(isXLargeScreen ? 400 : 300),
        width: isXLargeScreen ? 400 : 300,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full flex flex-col gap-4">
        <div className="flex justify-between items-center border-b p-3.5">
          <h2 className="text-lg font-semibold tracking-tight">Chat History</h2>
          <Button
            className={cn(
              "shadow-none bg-transparent hover:scale-110 transition-transform duration-200",
              "text-black dark:text-white",
              "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            onClick={() => setSideBarOpen(!sidebarOpen)}
          >
            <PanelLeftClose className="scale-[140%] sm:scale-150 xl:scale-[170%]" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {isUserThreadsLoading ? (
            <div className="space-y-3 px-2">
              {[...Array(isXLargeScreen ? 10 : 6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-10 w-full rounded-lg opacity-80 mb-3"
                />
              ))}
            </div>
          ) : userThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <MessageSquare className="w-6 h-6 text-gray-400 mb-3" />
              <p className="text-lg text-gray-500 font-medium">
                No conversations
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Your chat history will appear here
              </p>
            </div>
          ) : (
            userThreads.map((thread) => (
              <div
                key={thread.thread_id}
                className={`p-3 rounded-lg cursor-pointer mb-3 transition-colors ${
                  threadId === thread.thread_id
                    ? "bg-blue-50 text-blue-600 font-medium dark:bg-gray-600 dark:text-white"
                    : "text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                }`}
                onClick={() => {
                  setThreadId(thread.thread_id);
                }}
              >
                <p className="text-sm xl:text-[16px] hover:scale-[1.01] transition-transform truncate">
                  {(thread.values as any)?.messages?.[0]?.content
                    ?.toString()
                    .replace(/\n/g, " ")
                    .trim()
                    .slice(0, 50) || `Chat ${thread.thread_id.slice(0, 4)}`}
                </p>
                {threadId === thread.thread_id && (
                  <motion.div
                    className="mt-1.5 h-px bg-blue-200"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SideBar;
