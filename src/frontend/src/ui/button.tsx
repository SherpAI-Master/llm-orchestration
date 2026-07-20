import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Button-Größe (Padding/Font) */
  size?: ButtonSize;
  /** Visuelle Variante */
  variant?: ButtonVariant;
  /** Icon vor dem Text */
  startIcon?: ReactNode;
  /** Icon hinter dem Text */
  endIcon?: ReactNode;
  /** Zusätzliche Tailwind-Klassen */
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
};

/** Farbvarianten dynamisch über die CSS-Variable --brand */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand)] text-white shadow-sm hover:brightness-110 disabled:opacity-60",
  outline:
    "bg-white text-[var(--brand)] border border-[var(--brand)] hover:bg-gray-50 disabled:opacity-60",
  ghost:
    "bg-transparent text-[var(--brand)] hover:bg-gray-100 disabled:opacity-60",
};

const Button = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium
        transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? "cursor-not-allowed opacity-70" : ""}
        ${className}
      `}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      <span>{children}</span>
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
