import React, { RefObject } from "react";
import { Send, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onStopGenerating: () => void;
  isStreamLoading: boolean;
  isHistoryOpen: boolean;
  threadId: string | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  onStopGenerating,
  isStreamLoading,
  isHistoryOpen,
  threadId,
  inputRef,
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isStreamLoading) onSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isStreamLoading) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const isDisabled = !threadId || isStreamLoading || isHistoryOpen;
  const sendButtonDisabled =
    isHistoryOpen ||
    !threadId ||
    (isStreamLoading ? false : !inputValue.trim());

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={threadId ? "Type your message..." : "No active chat"}
          disabled={isDisabled}
          className="flex-1 resize-none min-h-[40px] max-h-[120px] rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none px-3 py-2 text-sm"
          rows={1}
        />
        <Button
          type={isStreamLoading ? "button" : "submit"}
          size="icon"
          disabled={sendButtonDisabled}
          className={cn(
            "text-white rounded-lg h-10 w-10 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            isStreamLoading
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          )}
          aria-label={isStreamLoading ? "Stop generating" : "Send message"}
          onClick={isStreamLoading ? onStopGenerating : undefined}
        >
          {isStreamLoading ? (
            <Square className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};
