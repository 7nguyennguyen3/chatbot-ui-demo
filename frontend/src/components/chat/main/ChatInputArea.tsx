import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useThreads } from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import { Switch } from "@radix-ui/react-switch";
import { Loader2, Send } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";

interface ChatInputAreaProps {
  userId: string | undefined;
  submittMessage: (message: string) => void;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  inputValue: string;
  thread: any;
  createThreadLoading: boolean;
  setShouldScroll: React.Dispatch<React.SetStateAction<boolean>>;
  hideToolCalls: boolean;
  setHideToolCalls: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatInputArea = ({
  createThreadLoading,
  inputValue,
  setHideToolCalls,
  hideToolCalls,
  setInputValue,
  setShouldScroll,
  thread,
  userId,
}: ChatInputAreaProps) => {
  const { createThread } = useThreads(userId ?? undefined);
  const [threadId, setThreadId] = useQueryState("threadId");

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
  );
};

export default ChatInputArea;
