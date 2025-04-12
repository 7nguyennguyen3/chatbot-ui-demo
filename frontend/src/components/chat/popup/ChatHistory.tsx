import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X, History } from "lucide-react";
import { Thread, Message } from "@langchain/langgraph-sdk";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const historyOverlayVariants = {
  hidden: {
    y: "100%",
    transition: {
      type: "tween",
      duration: 0.5,
      ease: "easeInOut",
    },
  },
  visible: {
    y: 0,
    transition: {
      type: "tween",
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

interface ChatHistoryProps {
  userId: string;
  currentThreadId: string | null;
  setThreadId: (id: string | null) => void;
  closeHistory: () => void;
  userThreads: Thread[];
  isUserThreadsLoading: boolean;
  getUserThreads: (id: string) => Promise<void>;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  userId,
  currentThreadId,
  setThreadId,
  closeHistory,
  userThreads,
  isUserThreadsLoading,
  getUserThreads,
}) => {
  useEffect(() => {
    if (userId) {
      getUserThreads(userId);
    }
  }, [userId, getUserThreads]);

  const handleThreadSelect = (id: string) => {
    setThreadId(id);
    closeHistory();
  };

  const getThreadTitle = (thread: Thread): string => {
    const messages = (thread.values as any)?.messages as Message[] | undefined;
    if (!messages) return `Chat ${thread.thread_id.slice(0, 5)}...`;

    const firstHumanMessage = messages.find((m) => m.type === "human");
    if (firstHumanMessage?.content) {
      return (
        String(firstHumanMessage.content)
          .replace(/\n/g, " ")
          .trim()
          .slice(0, 60) || `Chat ${thread.thread_id.slice(0, 5)}...`
      );
    }

    const firstMessage = messages[0];
    if (firstMessage?.content) {
      return (
        String(firstMessage.content).replace(/\n/g, " ").trim().slice(0, 60) ||
        `Chat ${thread.thread_id.slice(0, 5)}...`
      );
    }

    return `Chat ${thread.thread_id.slice(0, 5)}...`;
  };

  return (
    <motion.div
      variants={historyOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20 flex flex-col"
    >
      {/* History Header */}
      <div className="flex items-center justify-between p-3 pr-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 flex-shrink-0">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">
          Chat History
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeHistory}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8"
          aria-label="Close history"
        >
          <X className="scale-125" />
        </Button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {isUserThreadsLoading ? (
          <div className="space-y-2 px-1 pt-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-9 w-full rounded-md opacity-80 bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        ) : userThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <History className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              No conversations yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your chat history will appear here.
            </p>
          </div>
        ) : (
          userThreads.map((thread) => (
            <div
              key={thread.thread_id}
              className={cn(
                `p-2.5 rounded-lg cursor-pointer mb-1.5 transition-colors text-sm truncate`,
                currentThreadId === thread.thread_id
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              )}
              onClick={() => handleThreadSelect(thread.thread_id)}
            >
              {getThreadTitle(thread)}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
