import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const TypingIndicator: React.FC = () => {
  return (
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
  );
};
