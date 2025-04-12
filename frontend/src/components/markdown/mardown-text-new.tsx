"use client";

import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import { CheckIcon, CopyIcon } from "lucide-react";
import { FC, memo, useState } from "react";
import ReactMarkdown, { Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { TooltipIconButton } from "../ui/custom-tooltip";
import "./markdown-styles.css";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { protectShadcnComponents } from "@/components/markdown/markdown-utils";

interface CodeHeaderProps {
  language?: string;
  code: string;
}
const useCopyToClipboard = ({
  copiedDuration = 3000,
}: { copiedDuration?: number } = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const copyToClipboard = (value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };
  return { isCopied, copyToClipboard };
};
const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };
  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-gray-300">
      <span className="lowercase">{language || "code"}</span>
      <TooltipIconButton
        tooltip="Copy"
        onClick={onCopy}
        className="text-gray-300 hover:text-white"
      >
        {!isCopied && <CopyIcon className="h-4 w-4" />}
        {isCopied && <CheckIcon className="h-4 w-4 text-green-500" />}
      </TooltipIconButton>
    </div>
  );
};

const defaultComponents: Options["components"] = {
  h1: ({ className, node, ...props }) => (
    <h1
      className={cn(
        "mb-6 mt-8 scroll-m-20 text-4xl font-extrabold tracking-tight first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, node, ...props }) => (
    <h2
      className={cn(
        "mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, node, ...props }) => (
    <h3
      className={cn(
        "mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, node, ...props }) => (
    <h4
      className={cn(
        "mb-4 mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, node, ...props }) => (
    <h5
      className={cn(
        "my-4 text-lg font-semibold first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  h6: ({ className, node, ...props }) => (
    <h6
      className={cn(
        "my-4 text-base font-semibold first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  p: ({ className, node, ...props }) => (
    <p
      className={cn(
        "my-4 leading-relaxed text-base first:mt-0 last:mb-0",
        className
      )}
      {...props}
    />
  ),
  a: ({ className, node, ...props }) => (
    <a
      className={cn(
        "text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors text-base",
        className
      )}
      {...props}
    />
  ),
  blockquote: ({ className, node, ...props }) => (
    <blockquote
      className={cn(
        "border-l-4 border-primary/20 pl-4 md:pl-6 my-6",
        className
      )}
      {...props}
    />
  ),
  ul: ({ className, node, ...props }) => (
    <ul
      className={cn("my-4 ml-6 text-base list-disc [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, node, ...props }) => (
    <ol
      className={cn("my-4 ml-6 text-base list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  ),
  table: ({ className, node, ...props }) => (
    <div className="my-6 w-full overflow-x-auto border border-border rounded-lg">
      {" "}
      <table className={cn("w-full text-sm", className)} {...props} />{" "}
    </div>
  ),
  th: ({ className, node, ...props }) => (
    <th
      className={cn(
        "border-b border-border bg-muted px-4 py-3 text-left font-bold text-sm [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, node, ...props }) => (
    <td
      className={cn(
        "border-b border-border px-4 py-3 text-left text-sm [&[align=center]]:text-center [&[align=right]]:text-right group-last:border-b-0",
        className
      )}
      {...props}
    />
  ),

  pre: ({ className, node, ...props }) => (
    <div className="my-6 overflow-hidden rounded-lg bg-[#0d1117]">
      <pre
        className={cn("overflow-x-auto p-4 text-sm", className)}
        {...props}
      />
    </div>
  ),

  code: ({ className, node, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");

    if (match) {
      const language = match[1];
      const code = String(children).replace(/\n$/, "");
      return (
        <>
          <CodeHeader language={language} code={code} />
          <SyntaxHighlighter
            language={language}
            className={cn("text-sm", className)}
          >
            {code}
          </SyntaxHighlighter>
        </>
      );
    }

    return (
      <code
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },

  hr: ({ className, node, ...props }) => (
    <hr className={cn("my-6 border-t border-border", className)} {...props} />
  ),
  tr: ({ className, node, ...props }) => (
    <tr
      className={cn("transition-colors hover:bg-muted/50", className)}
      {...props}
    />
  ),
  sup: ({ className, node, ...props }) => (
    <sup className={cn("text-xs", className)} {...props} />
  ),
  li: ({ className, node, ...props }) => (
    <li className={cn("text-base", className)} {...props} />
  ),
  strong: ({ className, node, ...props }) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),
  em: ({ className, node, ...props }) => (
    <em className={cn("italic", className)} {...props} />
  ),
};

interface MarkdownTextProps {
  children: string;
  className?: string;
}
const MarkdownTextImpl: FC<MarkdownTextProps> = ({ children, className }) => {
  return (
    <div className={cn(className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={defaultComponents}
      >
        {protectShadcnComponents(children)}
      </ReactMarkdown>
    </div>
  );
};
export const MarkdownText = memo(MarkdownTextImpl);
