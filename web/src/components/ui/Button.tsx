import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "outline" | "primary" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  variant = "outline",
  size = "md",
  icon,
  iconRight,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = ["ui-btn", `ui-btn-${variant}`, `ui-btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {icon ? (
        <span className="ui-btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children ? <span className="ui-btn-label">{children}</span> : null}
      {iconRight ? (
        <span className="ui-btn-icon" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </button>
  );
}
