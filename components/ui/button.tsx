import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ButtonVariant, ButtonSize } from "@/types";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#ffe14d] text-ink border border-ink font-semibold hover:bg-[#fedb30] shadow-[0_1px_3px_rgba(29,29,27,0.12)] active:bg-[#f5cf1b]",
  secondary:
    "bg-paper text-ink border border-ink/20 hover:border-ink hover:bg-paper-warm shadow-sm",
  outline: "bg-transparent text-ink border border-ink hover:bg-ink/5",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-ink/5",
  danger:
    "bg-[#e0245e] text-white border border-[#c0184d] hover:bg-[#c91a4f] shadow-sm font-semibold",
  yellow:
    "bg-[#ffe14d] text-ink border border-ink font-semibold hover:bg-[#fedb30] shadow-[0_1px_3px_rgba(29,29,27,0.12)]",
  blue: "bg-[#bfe3ff] text-[#145388] border border-[#2986cc]/60 font-semibold hover:bg-[#aadeff] shadow-sm",
  pink: "bg-[#ff9ec4] text-[#780d34] border border-[#ff70a5] font-semibold hover:bg-[#ff8cb8] shadow-sm",
  ink: "bg-ink text-[#fafaf6] border border-ink hover:bg-[#32322f] shadow-sm font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs tracking-wide",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base font-medium",
  icon: "h-10 w-10 p-0 flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles with near-square corners (2px) and active micro-press
          "inline-flex items-center justify-center font-sans select-none rounded-[2px] cursor-pointer",
          "btn-press active:translate-y-px transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="inline-flex mr-2 shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex ml-2 shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
