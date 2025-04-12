"use client";

import { forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TooltipIconButtonProps = ButtonProps & {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
};

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(
  (
    { children, tooltip, side = "bottom", sideOffset = 4, className, ...rest },
    ref
  ) => {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              {...rest}
              className={cn(
                "bg-transparent text-black hover:bg-gray-100 hover:scale-110 transition transform duration  200",
                className
              )}
              ref={ref}
            >
              {children}
              <span className="sr-only">{tooltip}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "bg-black text-white text-sm",
              "p-2 z-999",
              "rounded-md",
              "max-w-[300px] min-w-max",
              "whitespace-nowrap",
              "text-center",
              "shadow-lg"
            )}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TooltipIconButton.displayName = "TooltipIconButton";
