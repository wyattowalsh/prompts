import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-input bg-card text-foreground hover:bg-muted",
        outline: "border border-input bg-card text-foreground hover:bg-muted",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground"
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3"
      }
    },
    defaultVariants: {
      variant: "outline",
      size: "md"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    icon?: ReactNode;
    iconRight?: ReactNode;
    asChild?: boolean;
  };

export function Button({
  variant = "outline",
  size = "md",
  icon,
  iconRight,
  className = "",
  children,
  type = "button",
  asChild = false,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {icon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children ? <span className="ui-btn-label">{children}</span> : null}
      {iconRight ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </Comp>
  );
}

export { buttonVariants };
