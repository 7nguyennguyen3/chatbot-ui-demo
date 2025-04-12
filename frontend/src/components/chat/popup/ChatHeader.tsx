import { TooltipIconButton } from "@/components/ui/custom-tooltip"; // Import TooltipIconButton
import { cn } from "@/lib/utils";
import { Bot, History, PlusSquare, X } from "lucide-react";
import React from "react";

interface ChatHeaderProps {
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onCreateNewChat: () => void;
  isNewChatDisabled: boolean;
  onCloseChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isHistoryOpen,
  onToggleHistory,
  onCreateNewChat,
  isNewChatDisabled,
  onCloseChat,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 pl-4 pr-2 border-b flex-shrink-0",
        "border-border", // Use theme border color
        "bg-muted/50" // Use theme muted background
      )}
    >
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-blue-600 flex-shrink-0" />
        <h2 className="text-lg font-semibold text-foreground">Assistant</h2>
      </div>
      <div className="flex items-center gap-1">
        <TooltipIconButton
          tooltip="Toggle chat history"
          onClick={onToggleHistory}
          className={cn(
            "rounded-full w-8 h-8", // Base size & shape
            "text-foreground", // Theme text color
            isHistoryOpen
              ? "bg-accent" // Active background using theme accent
              : "hover:bg-accent" // Hover background using theme accent
          )}
          aria-label="Toggle chat history" // Keep aria-label
        >
          <History className="scale-125" />
        </TooltipIconButton>

        <TooltipIconButton
          tooltip="New chat"
          onClick={onCreateNewChat}
          disabled={isNewChatDisabled}
          className={cn(
            "rounded-full w-8 h-8", // Base size & shape
            "text-foreground hover:bg-accent", // Theme text & hover
            "disabled:opacity-50 disabled:cursor-not-allowed" // Disabled style
          )}
          aria-label="New chat" // Keep aria-label
        >
          <PlusSquare className="scale-125" />
        </TooltipIconButton>

        <TooltipIconButton
          tooltip="Close chat"
          onClick={onCloseChat}
          className={cn(
            "rounded-full w-8 h-8", // Base size & shape
            "text-foreground", // Theme text color
            // Destructive hover effect using theme colors
            "hover:bg-destructive/10 hover:text-destructive"
          )}
          aria-label="Close chat" // Keep aria-label
        >
          <X className="scale-125" />
        </TooltipIconButton>
      </div>
    </div>
  );
};
