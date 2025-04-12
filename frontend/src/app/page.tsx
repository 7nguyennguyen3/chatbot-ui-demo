"use client";

import NewChatIntro from "@/components/chat/main/NewChatIntro";
import TopBar from "@/components/chat/main/TopBar";
import Tutorial from "@/components/chat/main/Tutorial";
import { MarkdownText } from "@/components/markdown/mardown-text-new";
import {
  ScrollToBottom,
  StickyToBottomContent,
} from "@/components/messages/stick-to-bottom";
import { ToolCalls, ToolResult } from "@/components/messages/tool-calls";
import SideBar from "@/components/side-bar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useThreads } from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import useLoadingStore from "@/store/loading";
import useUserStore from "@/store/user";
import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { v4 as uuidv4 } from "uuid";

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("");
  const [hideToolCalls, setHideToolCalls] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  const [threadId, setThreadId] = useQueryState("threadId");
  const [sidebarOpen, _setSideBarOpen] = useQueryState(
    "sidebarOpen",
    parseAsBoolean.withDefault(false)
  );
  const [openTutorial, setOpenTutorial] = useState(false);

  const { userId, setUserId } = useUserStore();
  const { createThread } = useThreads(userId ?? undefined);
  const { createThreadLoading, setCreateThreadLoading } = useLoadingStore();

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    if (!storedUserId) {
      const newUserId = uuidv4();
      window.localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
      setOpenTutorial(true);
    } else if (!userId) {
      setUserId(storedUserId);
    }
  }, [userId]);

  useEffect(() => {
    const initialThread = async () => {
      setCreateThreadLoading(true);

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
        setCreateThreadLoading(false);
      }
    };
    initialThread();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShouldScroll(false);
  }, [shouldScroll]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = useStream<{ messages: Message[] }>({
    apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    assistantId: "growthbot",
    messagesKey: "messages",
    threadId: threadId,
  });

  const filteredMessages = hideToolCalls
    ? thread.messages.filter(
        (message) =>
          message.type !== "tool" &&
          message.content.toString().trim().length > 0
      )
    : thread.messages;

  const submitMessage = (message: string) => {
    if (!message.trim() || thread.isLoading) return;

    setInputValue("");
    setShouldScroll(true);
    thread.submit({ messages: [{ type: "human", content: message }] });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let threadId2 = threadId;

      if (!threadId2 && userId) {
        const newThread = await createThread(userId);
        if (newThread) {
          threadId2 = newThread.thread_id;
          setThreadId(threadId);
        }
      }

      if (threadId) {
        submitMessage(inputValue);
      }
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !thread.isLoading) {
      e.preventDefault();
      submitMessage(inputValue);
    }
  };

  const handleStop = () => {
    if (thread.isLoading) {
      thread.stop();
    }
  };

  return (
    <div className="h-screen">
      <TopBar
        setOpenTutorial={setOpenTutorial}
        setThreadId={setThreadId}
        userId={userId}
      />

      <div
        className={cn(
          "flex h-full bg-background pt-[64px] transition-all duration-300",
          sidebarOpen && "md:pl-[300px] xl:pl-[400px]"
        )}
      >
        {userId && <SideBar userId={userId} />}
        <StickToBottom className="relative flex-1">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-y-scroll h-screen max-w",
              filteredMessages.length === 0
                ? "flex items-center justify-center"
                : "grid grid-rows-[1fr_auto]"
            )}
            contentClassName={cn(
              "max-w-3xl xl:max-w-4xl w-full mx-auto p-4 flex flex-col gap-4 min-w-0",
              filteredMessages.length === 0 && "w-full"
            )}
            content={
              <>
                {/* Use enhanced welcome message with suggestions */}
                {filteredMessages.length === 0 &&
                !thread.isLoading &&
                !createThreadLoading ? (
                  <div className="w-full" />
                ) : // Loading state when empty
                filteredMessages.length === 0 &&
                  (thread.isLoading || createThreadLoading) ? (
                  <div className="flex flex-col items-center text-center gap-4 w-full my-auto">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  // Map and display messages when not empty
                  filteredMessages.map((msg) => {
                    // Apply theme-aware styles
                    if (msg.type === "ai") {
                      return (
                        <div
                          key={msg.id}
                          className="p-3 rounded-xl self-start bg-card text-card-foreground dark:p-5"
                        >
                          {msg.tool_calls && !hideToolCalls && (
                            <ToolCalls toolCalls={msg.tool_calls} />
                          )}
                          {msg.content && (
                            <MarkdownText>
                              {typeof msg.content === "string"
                                ? msg.content
                                : JSON.stringify(msg.content)}
                            </MarkdownText>
                          )}
                        </div>
                      );
                    }
                    if (msg.type === "tool") {
                      if (hideToolCalls) return null;
                      return (
                        <div
                          key={msg.id}
                          className="p-1 rounded-xl self-start my-2"
                        >
                          <ToolResult message={msg} />
                        </div>
                      );
                    }
                    // Human message
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-3 rounded-xl self-end my-2 max-w-[85%]",
                          // Use theme primary colors
                          "bg-primary text-primary-foreground"
                        )}
                      >
                        {typeof msg.content === "string"
                          ? msg.content
                          : JSON.stringify(msg.content) || ""}
                      </div>
                    );
                  })
                )}

                {/* Loading dots when AI is responding AFTER human message */}
                {thread.isLoading &&
                  filteredMessages.length > 0 &&
                  filteredMessages[filteredMessages.length - 1]?.type ===
                    "human" && (
                    <div className="p-3 rounded-xl self-start bg-card text-card-foreground">
                      <div className="flex space-x-1.5">
                        <span className="animate-[bounce_1s_infinite_0.1s] w-2 h-2 bg-muted-foreground rounded-full"></span>
                        <span className="animate-[bounce_1s_infinite_0.2s] w-2 h-2 bg-muted-foreground rounded-full"></span>
                        <span className="animate-[bounce_1s_infinite_0.3s] w-2 h-2 bg-muted-foreground rounded-full"></span>
                      </div>
                    </div>
                  )}

                {/* Div to help scrolling */}
                <div ref={bottomRef} className="h-0 flex-shrink-0" />
              </>
            }
            footer={
              <motion.div
                className={cn(
                  "sticky bottom-0 w-full bg-white dark:bg-[var(--background)/0.9]",
                  filteredMessages.length === 0 && "absolute top-[55%]"
                )}
                initial={false}
                animate={{
                  y: filteredMessages.length === 0 ? "-50%" : "0%",
                }}
                transition={{
                  type: "spring",
                  duration: 1,
                }}
              >
                <ScrollToBottom
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 
                animate-in fade-in-0 zoom-in-95 text-md p-4 font-semibold 
                dark:bg-gray-600 dark:hover:bg-gray-800"
                />
                {filteredMessages.length == 0 && (
                  <NewChatIntro submitMessage={submitMessage} />
                )}
                <div className="max-w-3xl xl:max-w-4xl mx-auto pb-4 px-4">
                  <form onSubmit={handleSubmit}>
                    <div
                      className="flex flex-col w-full items-center border bg-accent 
                    p-3 rounded-xl shadow-md"
                    >
                      <Textarea
                        name="message"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className={cn(
                          "w-full max-h-[200px] min-h-[60px] resize-none",
                          "border-0 shadow-none",
                          "focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                          "text-[16px] lg:text-lg",
                          "text-foreground placeholder:text-muted-foreground",
                          "bg-transparent dark:bg-transparent"
                        )}
                        required
                        disabled={thread.isLoading}
                        onKeyDown={handleKeyDown}
                      />
                      <div className="flex items-center justify-between w-full px-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="hideToolCalls"
                            checked={hideToolCalls}
                            onCheckedChange={setHideToolCalls}
                            className="cursor-pointer"
                          />
                          <label
                            htmlFor="hideToolCalls"
                            className="text-sm sm:text-[16px] lg:text-lg text-muted-foreground cursor-pointer"
                          >
                            Hide tool
                          </label>
                        </div>
                        <Button
                          type={thread.isLoading ? "button" : "submit"}
                          className={cn(
                            "transition-colors rounded-lg cursor-pointer dark:bg-gray-600 dark:text-white",
                            thread.isLoading
                              ? "bg-red-400 hover:bg-red-400/80 dark:bg-red-400/80"
                              : "bg-primary hover:bg-primary/90 text-white"
                          )}
                          onClick={thread.isLoading ? handleStop : undefined}
                          disabled={
                            !threadId ||
                            createThreadLoading ||
                            (!thread.isLoading && inputValue.trim() === "")
                          }
                        >
                          {thread.isLoading ? (
                            <p className="text-[16px] flex items-center gap-4">
                              <Loader2 className="scale-120 animate-spin" />
                              Stop
                            </p>
                          ) : (
                            <p className="text-[16px] flex items-center gap-4">
                              <Send className="scale-120" />
                              Send
                            </p>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            }
          />
        </StickToBottom>
        {openTutorial && <Tutorial setOpenTutorial={setOpenTutorial} />}
      </div>
    </div>
  );
}
