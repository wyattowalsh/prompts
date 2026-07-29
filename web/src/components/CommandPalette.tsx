import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { catalog } from "../lib/catalog";
import { buildCommandIndexFromCatalog, filterCommandItems } from "../lib/command-index";
import { cn } from "../lib/utils";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const allItems = useMemo(() => buildCommandIndexFromCatalog(catalog), []);
  const items = useMemo(() => filterCommandItems(allItems, query), [allItems, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Global ⌘/Ctrl+K is owned by App (hotkey-before-lazy). Dialog handles Esc/focus trap.

  const groups = ["Pages", "Recipes", "Patterns"] as const;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Site command palette"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-[80] bg-foreground/40 backdrop-blur-[2px]"
      contentClassName={cn(
        "fixed left-1/2 top-[12vh] z-[81] w-[min(100%-2rem,36rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-lift)]"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search size={16} className="text-muted-foreground" aria-hidden="true" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Jump to recipes, patterns, sources…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
        />
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          Esc
        </kbd>
      </div>
      <Command.List className="max-h-[min(22rem,50vh)] overflow-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
          No matches. Try another keyword.
        </Command.Empty>
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
            <Command.Group
              key={group}
              heading={group}
              className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {groupItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.title} ${item.keywords}`}
                  onSelect={() => {
                    onOpenChange(false);
                    navigate(item.href);
                  }}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-lg px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          );
        })}
      </Command.List>
    </Command.Dialog>
  );
}

export default CommandPalette;
