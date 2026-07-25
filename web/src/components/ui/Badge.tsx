import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "accent" | "muted" | "success";
  icon?: ReactNode;
  className?: string;
};

export function Badge({ children, tone = "accent", icon, className = "" }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>
      {icon ? (
        <span className="ui-badge-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}
