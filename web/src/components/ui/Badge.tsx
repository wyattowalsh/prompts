import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        accent: "border-primary/25 bg-accent text-accent-foreground",
        muted: "border-border bg-muted text-muted-foreground",
        success: "border-success/30 bg-success/10 text-success"
      }
    },
    defaultVariants: {
      tone: "accent"
    }
  }
);

type BadgeProps = {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
} & VariantProps<typeof badgeVariants>;

export function Badge({ children, tone = "accent", icon, className = "" }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {icon ? (
        <span className="inline-flex" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}

export { badgeVariants };
