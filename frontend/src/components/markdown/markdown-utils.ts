export const SHADCN_COMPONENTS = [
  "Tooltip",
  "TooltipTrigger",
  "TooltipContent",
  "TooltipProvider",
  "DropdownMenu",
  "AlertDialog",
  "Popover",
  "Dialog",
];

export function protectShadcnComponents(content: string): string {
  const componentPattern = new RegExp(
    `<(${SHADCN_COMPONENTS.join("|")})(\\s+[^>]*)?>`,
    "gi"
  );

  return content.replace(componentPattern, (match) =>
    match.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  );
}
