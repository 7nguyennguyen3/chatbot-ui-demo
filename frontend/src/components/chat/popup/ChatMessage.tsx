import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Message } from "@langchain/langgraph-sdk";
import { cn } from "@/lib/utils";
import { MarkdownText } from "../../markdown/mardown-text-new";

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex w-full relative px-1 pb-5",
        message.type === "human" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          // Base styles (padding, rounding, etc.)
          "p-3 rounded-xl break-words relative shadow-sm",

          // Conditional max-width based on message type and screen size
          message.type === "human"
            ? "max-w-[85%]" // Human messages always capped at 85%
            : "max-w-full lg:max-w-[85%] lg:ml-2", // AI messages: full width on small screens, 85% on large (lg:) and up

          // Conditional background/text/rounding based on message type
          message.type === "human"
            ? "bg-blue-500 text-white rounded-br-lg"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-lg"
        )}
      >
        {message.content && (
          <MarkdownText>{String(message.content)}</MarkdownText>
        )}
        <div
          className={cn(
            "absolute bottom-[-10px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 p-0.5 shadow-md ring-1",
            message.type === "human"
              ? "right-[-12px] ring-blue-500"
              : "left-[-12px] ring-gray-300 dark:ring-gray-600"
          )}
        >
          {message.type === "human" ? (
            <div className="flex items-center justify-center w-full h-full rounded-full bg-blue-100 dark:bg-blue-900">
              <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-300" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full rounded-full bg-gray-200 dark:bg-gray-600">
              <Bot className="w-4.5 h-4.5 text-gray-800 dark:text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
