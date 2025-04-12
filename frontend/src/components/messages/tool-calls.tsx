import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-4 max-w-2xl">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className={cn("border rounded-lg overflow-hidden", "border-border")}
          >
            <div className={cn("p-2 border-b", "bg-muted/50 border-border")}>
              <h3 className="font-medium text-foreground flex items-center justify-between flex-wrap gap-2">
                <div>
                  Tool Call:{" "}
                  <code
                    className={cn(
                      "ml-2 text-sm px-2 py-1 rounded",
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {tc.name}
                  </code>
                </div>
                {tc.id && (
                  <code
                    className={cn(
                      "ml-2 text-sm px-2 py-1 rounded",
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {tc.id}
                  </code>
                )}
              </h3>
            </div>
            {hasArgs ? (
              <div className="space-y-px bg-muted/20">
                {Object.entries(args).map(([key, value], argIdx) => (
                  <div
                    key={argIdx}
                    className={cn(
                      "gap-4 p-3 flex justify-between bg-background border-b"
                    )}
                  >
                    <div className="w-1/3 font-medium text-foreground shrink-0 break-words border-r">
                      {key}
                    </div>
                    <div className="text-muted-foreground break-words min-w-0">
                      {isComplexValue(value) ? (
                        <pre
                          className={cn(
                            "p-2 rounded-md overflow-x-auto text-sm",
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <span>{String(value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  "p-3 text-sm",
                  "bg-muted/50 text-muted-foreground"
                )}
              >
                {"{}"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = true;
    } else {
      parsedContent = message.content;
    }
  } catch {
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? contentStr.length > 500
        ? contentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : contentStr;

  return (
    <div className={cn("border rounded-lg overflow-hidden", "border-border")}>
      <div className={cn("px-4 py-2 border-b", "bg-muted/50 border-border")}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {message.name ? (
            <h3 className="font-medium text-foreground">
              Tool Result:{" "}
              <code
                className={cn(
                  "px-2 py-1 rounded",
                  "bg-muted text-muted-foreground"
                )}
              >
                {message.name}
              </code>
            </h3>
          ) : (
            <h3 className="font-medium text-foreground">Tool Result</h3>
          )}
          {message.tool_call_id && (
            <code
              className={cn(
                "ml-2 text-sm px-2 py-1 rounded",
                "bg-muted text-muted-foreground"
              )}
            >
              {message.tool_call_id}
            </code>
          )}
        </div>
      </div>
      <motion.div
        className={cn("min-w-full", "bg-muted/20")}
        initial={false}
        animate={{ height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isExpanded ? "expanded" : "collapsed"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isJsonContent ? (
                <div className="overflow-x-auto">
                  <table className={cn("min-w-full divide-y", "divide-border")}>
                    <tbody className={cn("divide-y", "divide-border")}>
                      {(Array.isArray(parsedContent)
                        ? isExpanded
                          ? parsedContent
                          : parsedContent.slice(0, 5)
                        : Object.entries(parsedContent)
                      ).map((item, argIdx) => {
                        const [key, value] = Array.isArray(parsedContent)
                          ? [argIdx, item]
                          : [item[0], item[1]];
                        return (
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap align-top">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-muted-foreground align-top">
                              {isComplexValue(value) ? (
                                <code
                                  className={cn(
                                    "rounded px-2 py-1 font-mono text-sm whitespace-pre-wrap break-all block",
                                    "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {JSON.stringify(value, null, 2)}
                                </code>
                              ) : (
                                String(value)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <code className="text-sm block whitespace-pre-wrap break-all text-muted-foreground">
                  {displayedContent}
                </code>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {((shouldTruncate && !isJsonContent) ||
          (isJsonContent &&
            Array.isArray(parsedContent) &&
            parsedContent.length > 5)) && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full py-2 flex items-center justify-center border-t",
              "border-border text-muted-foreground hover:text-foreground",
              "hover:bg-muted transition-all ease-in-out duration-200 cursor-pointer"
            )}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.0 }}
            whileTap={{ scale: 0.98 }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="ml-1 text-xs">
              {isExpanded ? "Collapse" : "Expand"}
            </span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
