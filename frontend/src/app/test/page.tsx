"use client";

import { TooltipIconButton } from "@/components/ui/custom-tooltip";
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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useThreads } from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import useLoadingStore from "@/store/loading";
import useUserStore from "@/store/user";
import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import { motion } from "framer-motion";
import { Loader2, PanelLeftOpen, Send, SquarePen } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { v4 as uuidv4 } from "uuid";

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("");
  const [hideToolCalls, setHideToolCalls] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  const [threadId, setThreadId] = useQueryState("threadId");
  const [sidebarOpen, setSideBarOpen] = useQueryState(
    "sidebarOpen",
    parseAsBoolean.withDefault(false)
  );

  const { userId, setUserId } = useUserStore();
  const { createThread } = useThreads(userId ?? undefined);
  const { createThreadLoading, setCreateThreadLoading } = useLoadingStore();

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    if (!storedUserId) {
      const newUserId = uuidv4();
      window.localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    } else if (!userId) {
      setUserId(storedUserId);
    }
  }, []);

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
  }, []);

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

  const isXLargeScreen = useMediaQuery("(min-width: 1280px)");
  const sidebarWidth = isXLargeScreen ? 400 : 300;

  return (
    <div className="h-screen">
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
          "fixed top-0 left-0 right-0 w-full px-5 py-3 z-50 bg-white/90 backdrop-blur-md shadow-sm"
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
              "shadow-none bg-transparent text-black hover:bg-gray-100 hover:scale-110 transition-transform duration-200",
              sidebarOpen ? "hidden" : "flex"
            )}
            onClick={() => setSideBarOpen(!sidebarOpen)}
          >
            <PanelLeftOpen className="scale-[140%] sm:scale-150 xl:scale-[170%]" />
          </Button>
          <TooltipIconButton
            tooltip="New chat"
            onClick={async () => {
              const thread = await createThread(userId ?? "");
              if (thread) {
                setThreadId(thread.thread_id);
              }
            }}
          >
            <SquarePen className="scale-[140%] sm:scale-150 xl:scale-[170%]" />
          </TooltipIconButton>
        </motion.div>
      </motion.nav>

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
              filteredMessages.length === 0 ? (
                <div className="w-full" />
              ) : (
                filteredMessages.map((msg) => {
                  if (msg.type === "ai") {
                    return (
                      <div key={msg.id} className="p-3 rounded-xl">
                        {msg.tool_calls && !hideToolCalls && (
                          <ToolCalls toolCalls={msg.tool_calls} />
                        )}
                        {msg.content && (
                          <MarkdownText>{msg.content.toString()}</MarkdownText>
                        )}
                      </div>
                    );
                  }
                  if (msg.type === "tool") {
                    return (
                      <div key={msg.id} className="p-3 rounded-xl">
                        <ToolResult message={msg} />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-xl",
                        msg.type === "human"
                          ? "bg-indigo-50 flex items-center self-end my-4"
                          : "bg-transparent"
                      )}
                    >
                      <MarkdownText>
                        {msg.content?.toString() || ""}
                      </MarkdownText>
                    </div>
                  );
                })
              )
            }
            footer={
              <motion.div
                className={cn(
                  "sticky bottom-0 w-full bg-white",
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
                animate-in fade-in-0 zoom-in-95 text-md p-4 font-semibold"
                />
                {filteredMessages.length == 0 && (
                  <div className="flex flex-col items-center gap-4 w-full mb-10">
                    <h2 className="text-3xl font-semibold">
                      Welcome to Seeker!
                    </h2>
                    <h4 className="text-xl">How can I help you today?</h4>
                  </div>
                )}
                <div ref={bottomRef} />
                <div className="max-w-3xl xl:max-w-4xl mx-auto pb-4 px-4">
                  <form onSubmit={handleSubmit}>
                    <div
                      className="flex flex-col gap-2 w-full items-center border bg-accent 
                    py-3 px-6 rounded-xl shadow-md"
                    >
                      <Textarea
                        name="message"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full max-h-[200px] min-h-[60px] resize-none border-0 shadow-none focus:border-0 
                        focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent 
                        p-0 text-black text-[16px] lg:text-lg"
                        required
                        disabled={thread.isLoading}
                        onKeyDown={handleKeyDown}
                      />
                      <div className="flex items-center justify-between w-full">
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
                            "transition-colors rounded-lg cursor-pointer",
                            thread.isLoading
                              ? "bg-red-400 hover:bg-red-400/80"
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
      </div>
    </div>
  );
}
