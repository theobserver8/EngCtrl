import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong active:bg-brand-strong",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/90",
  secondary:
    "bg-sheet text-ink border border-line-strong hover:border-ink-faint hover:bg-paper active:bg-line/60",
};

function Button({
  variant = "primary",
  icon,
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) {
  // Minimum height (not fixed) so a long label can wrap on narrow screens.
  return (
    <button
      type={type}
      className={`focus-ring inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control px-4 py-2 text-center text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="size-4 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
