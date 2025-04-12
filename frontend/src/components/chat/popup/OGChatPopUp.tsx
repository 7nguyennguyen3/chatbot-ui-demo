"use client";

import React, {
  useState,
  useEffect,
  useRef,
  UIEvent,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryState } from "nuqs";
import { Client, Thread, Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Square,
  User,
  ArrowDown,
  History,
  PlusSquare,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Assuming path from your project structure
import { useMediaQuery } from "@/hooks/useMediaQuery"; // Assuming path from your project structure
import { MarkdownText } from "../../markdown/mardown-text-new"; // Assuming path

export type StreamStateType = { messages: Message[] };

// --- Animation Variants ---
const popupVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  closed: { opacity: 0, y: 50, scale: 0.8, transition: { duration: 0.2 } },
};

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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

// --- ChatHistory Component (Internal) ---
interface ChatHistoryProps {
  userId: string;
  currentThreadId: string | null;
  setThreadId: (id: string | null) => void;
  closeHistory: () => void;
  userThreads: Thread[];
  isUserThreadsLoading: boolean;
  getUserThreads: (id: string) => Promise<void>;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
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
              {/* Attempt to get first user message content for title */}
              {(thread.values as any)?.messages
                ?.find((m: Message) => m.type === "human")
                ?.content?.toString()
                .replace(/\n/g, " ")
                .trim()
                .slice(0, 60) ||
                // Fallback to first message of any type
                (thread.values as any)?.messages?.[0]?.content
                  ?.toString()
                  .replace(/\n/g, " ")
                  .trim()
                  .slice(0, 60) ||
                // Fallback to generic name
                `Chat ${thread.thread_id.slice(0, 5)}...`}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// --- Main ChatPopup Component ---
const ChatPopup: React.FC = () => {
  // --- State ---
  const [threadId, setThreadId] = useQueryState("threadId", { shallow: false }); // Ensure URL updates trigger re-renders if needed
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userId, setLocalUserId] = useState<string | null>(null);
  const [isUserThreadsLoading, setIsUserThreadsLoading] = useState(false);
  const [userThreads, setUserThreads] = useState<Thread[]>([]);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  // --- Refs ---
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledRef = useRef(false);

  // --- Migrated Thread Logic ---
  const createClient = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiUrl) {
      console.error(
        "API URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL."
      );
      toast.error("Chat service is not configured correctly.");
      return null;
    }
    return new Client({ apiUrl });
  }, []);

  const getUserThreads = useCallback(
    async (id: string) => {
      if (!id) return;
      const client = createClient();
      if (!client) return;

      setIsUserThreadsLoading(true);
      try {
        const fetchedThreads = (await client.threads.search({
          metadata: { user_id: id },
          limit: 100, // You might want pagination for > 100 threads
        })) as Awaited<Thread[]>;

        // Filter out threads that might be empty or lack proper message structure
        const validThreads = fetchedThreads.filter(
          (thread: any) => thread.values?.messages?.length > 0
        );

        // Sort threads: More recent threads (based on updated_at) first
        // Ensure updated_at exists and is a valid date string or handle errors
        validThreads.sort((a, b) => {
          try {
            const timeA = new Date(a.updated_at ?? 0).getTime();
            const timeB = new Date(b.updated_at ?? 0).getTime();
            return timeB - timeA; // Descending order
          } catch (e) {
            return 0; // Keep original order if dates are invalid
          }
        });

        setUserThreads(validThreads);
      } catch (error) {
        console.error("Error fetching threads:", error);
        toast.error("Failed to load chat history.");
        setUserThreads([]);
      } finally {
        setIsUserThreadsLoading(false);
      }
    },
    [createClient]
  );

  const createThread = useCallback(
    async (id: string) => {
      if (!id) {
        console.error("Cannot create thread without User ID");
        toast.error("User information missing.");
        return null;
      }
      const client = createClient();
      if (!client) return null;

      let thread = null;
      // Add a loading state specific to thread creation if needed
      // const [isCreatingThread, setIsCreatingThread] = useState(false);
      // setIsCreatingThread(true);
      try {
        thread = await client.threads.create({
          metadata: { user_id: id },
        });
        if (!thread || !thread.thread_id) {
          throw new Error("Thread creation failed - Invalid response");
        }
        // Optimistically add to state or re-fetch full list
        // Consider just switching threadId and letting history fetch on next open
        // For simplicity, we won't auto-refresh history list here
        toast.success("New chat created!");
      } catch (error) {
        console.error("Error creating thread:", error);
        toast.error("Failed to create new chat. Please try again.");
        thread = null;
      } finally {
        // setIsCreatingThread(false);
      }
      return thread;
    },
    [createClient]
  );

  // --- User ID Management ---
  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    if (!storedUserId) {
      const newUserId = uuidv4();
      window.localStorage.setItem("userId", newUserId);
      setLocalUserId(newUserId);
    } else {
      setLocalUserId(storedUserId);
    }
  }, []);

  // --- Message Streaming ---
  const threadStream = useStream<StreamStateType>({
    apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    assistantId: "growthbot",
    messagesKey: "messages",
    threadId: threadId ?? undefined,
    // Add error handling for the stream itself
    // onError: (error) => {
    //   console.error("Streaming error:", error);
    //   toast.error("An error occurred during the chat.");
    // }
  });
  const {
    messages = [],
    isLoading: isStreamLoading = false,
    submit,
    stop,
  } = threadStream ?? {};

  // --- Scroll Logic ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const element = chatContainerRef.current;
    if (element) {
      userScrolledRef.current = false;
      element.scrollTo({ top: element.scrollHeight, behavior });
      // Ensure button hides reliably
      requestAnimationFrame(() => {
        setShowScrollDownButton(false);
      });
    }
  }, []); // Empty dependency array

  // Effect for auto-scrolling or managing scroll button visibility
  useEffect(() => {
    const element = chatContainerRef.current;
    if (isOpen && element && !isHistoryOpen) {
      const isNearBottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 150;

      // If user just sent a message OR they are near bottom and haven't manually scrolled away
      if (
        messages[messages.length - 1]?.type === "human" ||
        (isNearBottom && !userScrolledRef.current)
      ) {
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      }

      // Check if scroll button should be shown after messages update
      const shouldShowButton =
        element.scrollTop < element.scrollHeight - element.clientHeight - 100;
      // Update button visibility, but respect manual scroll flag if needed
      if (shouldShowButton && userScrolledRef.current) {
        setShowScrollDownButton(true);
      } else if (!shouldShowButton) {
        setShowScrollDownButton(false);
        // If they naturally reached bottom via stream, reset manual scroll flag
        if (!userScrolledRef.current && isNearBottom) {
          // No state change needed, just potential reset of flag if logic requires
        }
      }
    }
    // Hide button if popup closes or history opens
    if (!isOpen || isHistoryOpen) {
      setShowScrollDownButton(false);
    }
  }, [messages, isOpen, isHistoryOpen, scrollToBottom]); // Rerun when messages, open state, or history state change

  // Effect for focusing input
  useEffect(() => {
    if (isOpen && !isHistoryOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150); // Slightly longer delay might help ensure element is ready
      return () => clearTimeout(timer);
    }
  }, [isOpen, isHistoryOpen]);

  // Handler for manual scroll events in chat container
  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isScrolledUp =
      element.scrollTop < element.scrollHeight - element.clientHeight - 100;
    const isNearBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 5; // Use a small threshold for "at bottom"

    if (isScrolledUp) {
      // Check if the scroll was likely initiated by user (prevents flicker if program scrolls near top)
      if (element.scrollHeight > element.clientHeight) {
        // Only track if scrollable
        userScrolledRef.current = true;
        setShowScrollDownButton(true);
      }
    } else {
      // If user scrolls back down near/to bottom manually, hide button
      setShowScrollDownButton(false);
      // If they reach the bottom, allow auto-scroll to resume
      if (isNearBottom) {
        userScrolledRef.current = false;
      }
    }
  }, []); // Empty dependency array

  // --- Event Handlers ---
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isStreamLoading || !threadId) return;
    const messageContent = inputValue;
    setInputValue("");
    userScrolledRef.current = false; // Allow auto-scroll
    submit?.({ messages: [{ type: "human", content: messageContent }] });
    // Scroll happens via useEffect reacting to message change
  }, [inputValue, isStreamLoading, threadId, submit]);

  const handleStopGenerating = useCallback(() => {
    if (isStreamLoading) stop?.();
  }, [isStreamLoading, stop]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isStreamLoading) handleSendMessage();
    },
    [isStreamLoading, handleSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isStreamLoading) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [isStreamLoading, handleSendMessage]
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((current) => {
      const newState = !current;
      if (newState) {
        userScrolledRef.current = false;
        setShowScrollDownButton(false);
        setIsHistoryOpen(false);
        // Scroll to bottom instantly when opening
        // Use setTimeout to ensure element exists after state update
        setTimeout(() => scrollToBottom("auto"), 0);
      }
      return newState;
    });
  }, [scrollToBottom]); // Include scrollToBottom dependency

  const toggleHistory = useCallback(() => {
    setIsHistoryOpen((current) => {
      const newState = !current;
      if (newState) {
        setShowScrollDownButton(false);
      }
      // Re-focus input if closing history? Maybe not needed.
      // else {
      //    inputRef.current?.focus();
      // }
      return newState;
    });
  }, []);

  const handleCreateNewChat = useCallback(async () => {
    if (!userId) {
      toast.error("Cannot create chat: User ID missing.");
      return;
    }
    try {
      const newThread = await createThread(userId);
      if (newThread?.thread_id) {
        // Update the URL query state, which will trigger useStream to update
        setThreadId(newThread.thread_id);
        setIsHistoryOpen(false); // Ensure history is closed
        setInputValue(""); // Clear any pending input
        // Let the stream hook clear messages based on new threadId
        setTimeout(() => scrollToBottom("auto"), 0); // Scroll to top (empty chat)
      }
    } catch (error) {
      // Error handled within createThread (toast)
      console.error("Caught error during new chat creation:", error);
    }
  }, [userId, createThread, setThreadId, scrollToBottom]); // Include dependencies

  // --- Message Filtering ---
  const filteredMessages = messages.filter(
    (message) =>
      message.type !== "tool" &&
      !(
        typeof message.content === "string" &&
        message.content.trim().length === 0
      ) &&
      message.content != null
  );

  // --- Component Return ---
  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={popupVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={cn(
              "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col",
              "lg:h-[70vh] lg:max-h-[600px]",
              "h-[85vh]", // Mobile height
              isLargeScreen ? "w-[512px]" : "w-[calc(100vw-32px)] max-w-md" // Desktop width
            )}
            style={{ maxHeight: "calc(100dvh - 4rem)" }} // Dynamic max height
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 pl-4 pr-2 border-b border-gray-200
             dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-blue-500 flex-shrink-0" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Assistant
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleHistory}
                  className={cn(
                    "text-gray-600 dark:text-gray-400 rounded-full w-8 h-8",
                    isHistoryOpen
                      ? "bg-gray-200 dark:bg-gray-700"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                  aria-label="Toggle chat history"
                >
                  <History className="scale-125" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateNewChat}
                  disabled={!userId} // Consider adding || isCreatingThread if using that state
                  className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8 disabled:opacity-50"
                  aria-label="New chat"
                >
                  <PlusSquare className="scale-125" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleOpen}
                  className="text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-full w-8 h-8"
                  aria-label="Close chat"
                >
                  <X className="scale-125" />
                </Button>
              </div>
            </div>

            {/* Message Area Wrapper */}
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
              {/* History Panel Overlay */}
              <AnimatePresence>
                {isHistoryOpen && userId && (
                  <ChatHistory
                    userId={userId}
                    currentThreadId={threadId}
                    setThreadId={setThreadId}
                    closeHistory={() => setIsHistoryOpen(false)}
                    userThreads={userThreads}
                    isUserThreadsLoading={isUserThreadsLoading}
                    getUserThreads={getUserThreads}
                  />
                )}
              </AnimatePresence>

              {/* Message Display Area - Conditional visibility */}
              <div
                className={cn(
                  "absolute inset-0 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent", // Added scrollbar styling
                  isHistoryOpen ? "invisible opacity-0" : "visible opacity-100", // Control visibility
                  "transition-opacity duration-200" // Add transition
                )}
                ref={chatContainerRef}
                onScroll={handleScroll}
                aria-live="polite"
              >
                {/* Empty / Loading State */}
                {!threadId && !isStreamLoading && (
                  <div className="text-center text-gray-500 dark:text-gray-400 p-4 pt-10">
                    {userId
                      ? "Start a new chat or select one from history."
                      : "Loading user data..."}
                  </div>
                )}

                {/* Initial Loading State for a Thread */}
                {threadId && isStreamLoading && messages.length === 0 && (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
                  </div>
                )}

                {/* Render Messages */}
                {threadId &&
                  filteredMessages.map((msg, index) => (
                    <motion.div
                      key={msg.id || `msg-${index}`}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      className={cn(
                        "flex w-full relative px-1 pb-5",
                        msg.type === "human" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          // Base styles (padding, rounding, etc.)
                          "p-3 rounded-xl break-words relative shadow-sm",

                          // Conditional max-width based on message type and screen size
                          msg.type === "human"
                            ? "max-w-[85%]" // Human messages always capped at 85%
                            : "max-w-full lg:max-w-[85%]", // AI messages: full width on small screens, 85% on large (lg:) and up

                          // Conditional background/text/rounding based on message type
                          msg.type === "human"
                            ? "bg-blue-500 text-white rounded-br-lg"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-lg"
                        )}
                      >
                        {msg.content && (
                          <MarkdownText>{String(msg.content)}</MarkdownText>
                        )}
                        <div
                          className={cn(
                            "absolute bottom-[-10px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 p-0.5 shadow-md ring-1",
                            msg.type === "human"
                              ? "right-[-12px] ring-blue-500"
                              : "left-[-12px] ring-gray-300 dark:ring-gray-600"
                          )}
                        >
                          {msg.type === "human" ? (
                            <div className="flex items-center justify-center w-full h-full rounded-full bg-blue-100 dark:bg-blue-900">
                              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full rounded-full bg-gray-200 dark:bg-gray-600">
                              <Bot className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {/* Streaming AI Response Indicator (improved check) */}
                {threadId &&
                  isStreamLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.type === "human" && (
                    <motion.div
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex w-full relative px-1 pb-5 justify-start"
                    >
                      <div className="p-3 rounded-xl max-w-[75%] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-bl-lg flex items-center relative shadow-sm">
                        <div className="flex space-x-1">
                          <span className="animate-[bounce_1s_infinite_0.1s] w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full"></span>
                          <span className="animate-[bounce_1s_infinite_0.2s] w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full"></span>
                          <span className="animate-[bounce_1s_infinite_0.3s] w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full"></span>
                        </div>
                        <div
                          className={cn(
                            "absolute bottom-[-10px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 p-0.5 shadow-md ring-1 left-[-12px] ring-gray-300 dark:ring-gray-600"
                          )}
                        >
                          <div className="flex items-center justify-center w-full h-full rounded-full bg-gray-200 dark:bg-gray-600">
                            <Bot className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
              </div>
              {/* End Message Display Area */}

              {/* Scroll Down Button */}
              <AnimatePresence>
                {showScrollDownButton && !isHistoryOpen && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => scrollToBottom("smooth")}
                    className="absolute bottom-4 right-4 z-10 bg-blue-500 text-white rounded-full p-2 shadow-md border border-blue-600 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Scroll to bottom"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            {/* End Message Area Wrapper */}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    threadId ? "Type your message..." : "No active chat"
                  }
                  disabled={!threadId || isStreamLoading || isHistoryOpen} // Disabled states
                  className="flex-1 resize-none min-h-[40px] max-h-[120px] rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none px-3 py-2 text-sm"
                  rows={1}
                />
                <Button
                  type={isStreamLoading ? "button" : "submit"}
                  size="icon"
                  disabled={
                    isHistoryOpen ||
                    !threadId ||
                    (isStreamLoading ? false : !inputValue.trim())
                  } // Disabled states
                  className={cn(
                    "text-white rounded-lg h-10 w-10 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                    isStreamLoading
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  )}
                  aria-label={
                    isStreamLoading ? "Stop generating" : "Send message"
                  }
                  onClick={isStreamLoading ? handleStopGenerating : undefined}
                >
                  {isStreamLoading ? (
                    <Square className="h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-blue-500 text-white rounded-full p-3 shadow-lg cursor-pointer fixed bottom-4 right-4 z-[100] flex items-center justify-center"
          onClick={toggleOpen}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  );
};

export default ChatPopup;
