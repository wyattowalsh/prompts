import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { useTheme, type ThemePreference } from "./theme-provider";
import { cn } from "../lib/utils";

const OPTIONS: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor }
];

const OPTION_COUNT = OPTIONS.length;

function iconForPreference(preference: ThemePreference) {
  if (preference === "dark") return Moon;
  if (preference === "system") return Monitor;
  return Sun;
}

function indexForPreference(preference: ThemePreference): number {
  const index = OPTIONS.findIndex((option) => option.id === preference);
  return index >= 0 ? index : 0;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { preference, resolved, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => indexForPreference(preference));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusMenuItemRef = useRef(false);
  const restoreTriggerFocusRef = useRef(false);
  const menuId = useId();
  const triggerId = useId();

  const activeOption = OPTIONS.find((option) => option.id === preference) ?? OPTIONS[0];
  const TriggerIcon = iconForPreference(preference);

  const closeMenu = useCallback((restoreFocus: boolean) => {
    restoreTriggerFocusRef.current = restoreFocus;
    focusMenuItemRef.current = false;
    setOpen(false);
  }, []);

  const openMenu = useCallback(
    (focusIndex?: number) => {
      const index = focusIndex ?? indexForPreference(preference);
      focusMenuItemRef.current = true;
      restoreTriggerFocusRef.current = false;
      setActiveIndex(index);
      setOpen(true);
    },
    [preference]
  );

  const focusItem = useCallback((index: number) => {
    const next = ((index % OPTION_COUNT) + OPTION_COUNT) % OPTION_COUNT;
    focusMenuItemRef.current = true;
    setActiveIndex(next);
  }, []);

  const selectPreference = useCallback(
    (value: ThemePreference) => {
      setPreference(value);
      closeMenu(true);
    },
    [closeMenu, setPreference]
  );

  // Focus the active menuitem after open / roving index updates.
  useEffect(() => {
    if (!open || !focusMenuItemRef.current) return;
    focusMenuItemRef.current = false;
    itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  // Restore trigger focus after close when requested.
  useEffect(() => {
    if (open || !restoreTriggerFocusRef.current) return;
    restoreTriggerFocusRef.current = false;
    triggerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      closeMenu(false);
    };

    const onFocusIn = (event: FocusEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      closeMenu(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [closeMenu, open]);

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          openMenu(event.key === "ArrowUp" ? OPTION_COUNT - 1 : indexForPreference(preference));
        }
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (open) {
          closeMenu(true);
        } else {
          openMenu();
        }
        break;
      }
      case "Escape": {
        if (open) {
          event.preventDefault();
          closeMenu(true);
        }
        break;
      }
      default:
        break;
    }
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        focusItem(activeIndex + 1);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        focusItem(activeIndex - 1);
        break;
      }
      case "Home": {
        event.preventDefault();
        focusItem(0);
        break;
      }
      case "End": {
        event.preventDefault();
        focusItem(OPTION_COUNT - 1);
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeMenu(true);
        break;
      }
      case "Tab": {
        // Dismiss without trapping focus so Tab continues normally.
        closeMenu(false);
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = OPTIONS[activeIndex];
        if (option) selectPreference(option.id);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-muted"
        )}
        aria-label={`Theme: ${activeOption.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={`Theme: ${activeOption.label}`}
        onClick={() => {
          if (open) {
            closeMenu(true);
          } else {
            openMenu();
          }
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <TriggerIcon size={15} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={triggerId}
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[10.5rem] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg"
          onKeyDown={onMenuKeyDown}
        >
          {OPTIONS.map(({ id, label, icon: Icon }, index) => {
            const active = preference === id;
            return (
              <button
                key={id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                tabIndex={index === activeIndex ? 0 : -1}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => selectPreference(id)}
              >
                <Icon size={15} aria-hidden="true" />
                <span className="flex-1 font-medium">{label}</span>
                {active ? (
                  <Check size={14} className="text-primary" aria-hidden="true" />
                ) : (
                  <span className="inline-block w-3.5" aria-hidden="true" />
                )}
              </button>
            );
          })}
          <p
            className="border-t border-border px-2.5 py-1.5 text-[0.7rem] leading-snug text-muted-foreground"
            aria-hidden="true"
          >
            Resolved: {resolved}
            {preference === "system" ? " (system)" : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
