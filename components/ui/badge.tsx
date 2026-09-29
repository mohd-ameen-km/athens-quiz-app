import React, { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { BadgeVariant, BadgeStyle, BadgeSize } from "@/types";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  styleVariant?: BadgeStyle;
  size?: BadgeSize;
  dot?: boolean;
}

// Accent colors: soft yellow (#ffe14d), soft pink (#ff9ec4), soft blue (#bfe3ff), and punch red (#e0245e)
const softVariantStyles: Record<BadgeVariant, string> = {
  yellow: "bg-[#ffe14d]/25 text-[#6b5400] border-[#ffe14d]/60",
  pink: "bg-[#ff9ec4]/25 text-[#9e1c4a] border-[#ff9ec4]/60",
  blue: "bg-[#bfe3ff]/35 text-[#145388] border-[#bfe3ff]/70",
  red: "bg-[#e0245e]/15 text-[#a51642] border-[#e0245e]/40",
  neutral: "bg-ink/8 text-ink border-ink/15",
  outline: "bg-transparent text-ink border-ink/20",
};

const solidVariantStyles: Record<BadgeVariant, string> = {
  yellow: "bg-[#ffe14d] text-ink border-[#ffe14d]",
  pink: "bg-[#ff9ec4] text-ink border-[#ff9ec4]",
  blue: "bg-[#bfe3ff] text-ink border-[#bfe3ff]",
  red: "bg-[#e0245e] text-white border-[#e0245e]",
  neutral: "bg-ink text-[#fafaf6] border-ink",
  outline: "bg-transparent text-ink border-ink/40",
};

const outlineVariantStyles: Record<BadgeVariant, string> = {
  yellow: "bg-transparent text-[#6b5400] border-[#ffe14d]",
  pink: "bg-transparent text-[#9e1c4a] border-[#ff9ec4]",
  blue: "bg-transparent text-[#145388] border-[#bfe3ff]",
  red: "bg-transparent text-[#e0245e] border-[#e0245e]",
  neutral: "bg-transparent text-ink border-ink/30",
  outline: "bg-transparent text-ink border-ink/30",
};

const dotColors: Record<BadgeVariant, string> = {
  yellow: "bg-[#d6a500]",
  pink: "bg-[#e05286]",
  blue: "bg-[#2986cc]",
  red: "bg-[#e0245e]",
  neutral: "bg-ink",
  outline: "bg-ink",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-5 px-1.5 text-[11px] gap-1 font-medium",
  md: "h-6 px-2.5 text-xs gap-1.5 font-medium",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "neutral",
      styleVariant = "soft",
      size = "md",
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const styleMap =
      styleVariant === "solid"
        ? solidVariantStyles
        : styleVariant === "outline"
          ? outlineVariantStyles
          : softVariantStyles;

    return (
      <span
        ref={ref}
        className={cn(
          // Near-square corners (2px on buttons/badges)
          "inline-flex items-center justify-center font-sans rounded-[2px] border select-none leading-none tracking-tight",
          styleMap[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
export default Badge;
