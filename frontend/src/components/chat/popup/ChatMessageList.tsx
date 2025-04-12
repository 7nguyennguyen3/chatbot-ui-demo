import React, { RefObject, UIEvent, useEffect, useState } from "react";
import { Message } from "@langchain/langgraph-sdk";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

interface ChatMessageListProps {
  messages: Message[];
  threadId: string | null;
  userId: string | null;
  isLoading: boolean;
  isHistoryOpen: boolean;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  threadId,
  userId,
  isLoading,
  isHistoryOpen,
  chatContainerRef,
  onScroll,
}) => {
  const showTypingIndicator =
    threadId &&
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.type === "human";

  // Add this state to track if we've shown the intro message
  const [showIntroMessage, setShowIntroMessage] = useState(false);

  useEffect(() => {
    if (threadId && messages.length === 0 && !isLoading && !showIntroMessage) {
      setTimeout(() => {
        setShowIntroMessage(true);
      }, 200);
    }
  }, [threadId, messages.length, isLoading, showIntroMessage]);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
        isHistoryOpen ? "invisible opacity-0" : "visible opacity-100",
        "transition-opacity duration-200"
      )}
      ref={chatContainerRef}
      onScroll={onScroll}
      aria-live="polite"
    >
      {!threadId && !isLoading && (
        <div className="text-center text-gray-500 dark:text-gray-400 p-4 pt-10">
          {userId
            ? "Start a new chat or select one from history."
            : "Loading user data..."}
        </div>
      )}

      {threadId && isLoading && messages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
        </div>
      )}

      {threadId && messages.length === 0 && !isLoading && showIntroMessage && (
        <ChatMessage
          message={{
            type: "ai",
            content:
              "Hello! 👋 I'm Petal, your assistant here at Petalsoft. 🌸 How can I help you with your skincare and cosmetic needs today? 💄✨",
          }}
        />
      )}

      {threadId &&
        messages.map((msg, index) => (
          <ChatMessage key={msg.id || `msg-${index}`} message={msg} />
        ))}

      {showTypingIndicator && <TypingIndicator />}
    </div>
  );
};
