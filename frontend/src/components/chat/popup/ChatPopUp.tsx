"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { Client, Message, Thread } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { debounce } from "lodash";
import { useQueryState } from "nuqs";
import React, {
  UIEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { ChatHeader } from "./ChatHeader";
import { ChatHistory } from "./ChatHistory";
import { ChatInputArea } from "./ChatInputArea";
import { ChatMessageList } from "./ChatMessageList";
import { ChatToggleButton } from "./ChatToggleButton";
import { ScrollDownButton } from "./ScrollDownButton";

export type StreamStateType = { messages: Message[] };

const popupVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  closed: { opacity: 0, y: 50, scale: 0.8, transition: { duration: 0.2 } },
};

// --- Main ChatPopup Component ---
const ChatPopup: React.FC = () => {
  const [threadId, setThreadId] = useQueryState("popup_thread_id");
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

  // --- Langchain Client Logic ---
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

  // --- Thread Management Logic ---
  const getUserThreads = useCallback(
    async (id: string) => {
      if (!id) return;
      const client = createClient();
      if (!client) return;

      setIsUserThreadsLoading(true);
      try {
        const fetchedThreads = (await client.threads.search({
          metadata: { user_id: id, graph_id: "agent" },
          limit: 100,
        })) as Awaited<Thread[]>;

        const validThreads = fetchedThreads.filter(
          (thread: any) => thread.values?.messages?.length > 0
        );

        validThreads.sort((a, b) => {
          try {
            const timeA = new Date(a.updated_at ?? 0).getTime();
            const timeB = new Date(b.updated_at ?? 0).getTime();
            return timeB - timeA;
          } catch (e) {
            return 0;
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
      try {
        thread = await client.threads.create({
          metadata: { user_id: id, graph_id: "agent" },
        });
        if (!thread || !thread.thread_id) {
          throw new Error("Thread creation failed - Invalid response");
        }
        // toast.success("New chat created!");
      } catch (error) {
        console.error("Error creating thread:", error);
        toast.error("Failed to create new chat. Please try again.");
        thread = null;
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
  }, [userId]);

  useEffect(() => {
    const initialThread = async () => {
      try {
        if (!threadId && userId) {
          const newThread = await createThread(userId);
          console.log(newThread);
          if (newThread) {
            setThreadId(newThread.thread_id);
          }
        }
      } catch (error) {
        console.error("Error creating thread:", error);
      } finally {
      }
    };
    initialThread();
  }, [userId]);

  // --- Message Streaming ---
  const threadStream = useStream<StreamStateType>({
    apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    assistantId: "agent",
    messagesKey: "messages",
    threadId: threadId ?? undefined,
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
      requestAnimationFrame(() => {
        setShowScrollDownButton(false);
      });
    }
  }, []);

  const debouncedScrollToBottom = useCallback(
    debounce(scrollToBottom, 250), // Adjust debounce time as needed
    [scrollToBottom]
  );

  // --- Scroll Effects ---
  useEffect(() => {
    const element = chatContainerRef.current;
    if (isOpen && element instanceof HTMLElement && !isHistoryOpen) {
      const isNearBottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 150;

      // Trigger scroll on new message or if near bottom
      if (messages.length > 0 || isNearBottom) {
        debouncedScrollToBottom("smooth");
      }

      const shouldShowButton =
        element.scrollTop < element.scrollHeight - element.clientHeight - 100;

      if (shouldShowButton && userScrolledRef.current) {
        setShowScrollDownButton(true);
      } else if (!shouldShowButton) {
        setShowScrollDownButton(false);
      }
    }
    if (!isOpen || isHistoryOpen) {
      setShowScrollDownButton(false);
    }
  }, [messages, isOpen, isHistoryOpen, debouncedScrollToBottom]);

  useEffect(() => {
    if (isOpen && !isHistoryOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isHistoryOpen]);

  // --- Event Handlers ---
  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isScrolledUp =
      element.scrollTop < element.scrollHeight - element.clientHeight - 100;
    const isNearBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 5;

    if (isScrolledUp) {
      if (element.scrollHeight > element.clientHeight) {
        userScrolledRef.current = true;
        setShowScrollDownButton(true);
      }
    } else {
      setShowScrollDownButton(false);
      if (isNearBottom) {
        userScrolledRef.current = false;
      }
    }
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isStreamLoading || !threadId || !submit) return;
    const messageContent = inputValue;
    setInputValue("");
    userScrolledRef.current = false;
    submit({ messages: [{ type: "human", content: messageContent }] });
  }, [inputValue, isStreamLoading, threadId, submit]);

  const handleStopGenerating = useCallback(() => {
    if (isStreamLoading && stop) stop();
  }, [isStreamLoading, stop]);

  const toggleOpen = useCallback(() => {
    setIsOpen((current) => {
      const newState = !current;
      if (newState) {
        userScrolledRef.current = false;
        setShowScrollDownButton(false);
        setIsHistoryOpen(false);
        setTimeout(() => scrollToBottom("auto"), 0);
      }
      return newState;
    });
  }, [scrollToBottom]);

  const toggleHistory = useCallback(() => {
    setIsHistoryOpen((current) => {
      const newState = !current;
      if (newState) {
        setShowScrollDownButton(false);
        // Fetch threads when opening history if userId is available
        if (userId) {
          getUserThreads(userId);
        }
      }
      return newState;
    });
  }, [userId, getUserThreads]); // Add dependencies

  const handleCreateNewChat = useCallback(async () => {
    if (!userId) {
      toast.error("Cannot create chat: User ID missing.");
      return;
    }
    try {
      const newThread = await createThread(userId);
      if (newThread?.thread_id) {
        setThreadId(newThread.thread_id);
        setIsHistoryOpen(false);
        setInputValue("");
        setTimeout(() => scrollToBottom("auto"), 0);
      }
    } catch (error) {
      console.error("Caught error during new chat creation:", error);
    }
  }, [userId, createThread, setThreadId, scrollToBottom]);

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
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={popupVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={cn(
              "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col",
              "lg:h-[70vh] lg:max-h-[800px]",
              "h-[85vh] max-h-[800px]", // Mobile height
              isLargeScreen ? "w-[512px]" : "w-[calc(100vw-32px)] max-w-md", // Desktop width
              "max-h-[calc(100dvh-4rem)]" // Dynamic max height using dvh
            )}
            // style={{ maxHeight: "calc(100dvh - 4rem)" }} // Keep if dvh isn't supported well enough
          >
            <ChatHeader
              isHistoryOpen={isHistoryOpen}
              onToggleHistory={toggleHistory}
              onCreateNewChat={handleCreateNewChat}
              isNewChatDisabled={!userId} // Pass disabled state based on userId
              onCloseChat={toggleOpen}
            />

            {/* Message Area Wrapper */}
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
              {/* History Panel Overlay */}
              <AnimatePresence>
                {isHistoryOpen && userId && (
                  <ChatHistory
                    userId={userId}
                    currentThreadId={threadId}
                    setThreadId={setThreadId} // Pass the setter function
                    closeHistory={() => setIsHistoryOpen(false)}
                    userThreads={userThreads}
                    isUserThreadsLoading={isUserThreadsLoading}
                    getUserThreads={getUserThreads}
                  />
                )}
              </AnimatePresence>

              {/* Message Display Area */}
              <ChatMessageList
                messages={filteredMessages}
                threadId={threadId}
                userId={userId}
                isLoading={isStreamLoading}
                isHistoryOpen={isHistoryOpen}
                chatContainerRef={chatContainerRef}
                onScroll={handleScroll}
              />

              {/* Scroll Down Button */}
              <AnimatePresence>
                {showScrollDownButton && !isHistoryOpen && (
                  <ScrollDownButton onClick={() => scrollToBottom("smooth")} />
                )}
              </AnimatePresence>
            </div>
            {/* End Message Area Wrapper */}

            {/* Input Area */}
            <ChatInputArea
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendMessage={handleSendMessage}
              onStopGenerating={handleStopGenerating}
              isStreamLoading={isStreamLoading}
              isHistoryOpen={isHistoryOpen}
              threadId={threadId}
              inputRef={inputRef}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && <ChatToggleButton onClick={toggleOpen} />}
    </div>
  );
};

export default ChatPopup;
