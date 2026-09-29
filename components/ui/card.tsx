import React, { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { CardVariant } from "@/types";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverLift?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  // Translucent "glass" card surface: rgb(250 250 246 / 0.62) with backdrop-filter: blur(22px) saturate(1.1) and box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.5)
  glass:
    "bg-[rgb(250_250_246/0.62)] backdrop-blur-[22px] backdrop-saturate-[1.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] border border-[rgba(29,29,27,0.08)]",
  solid:
    "bg-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_1px_3px_rgba(29,29,27,0.04)] border border-[rgba(29,29,27,0.12)]",
  outline: "bg-transparent border border-ink/20 shadow-none",
  "glass-yellow":
    "bg-[rgb(255_225_77/0.14)] backdrop-blur-[22px] backdrop-saturate-[1.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] border border-[#ffe14d]/60",
  "glass-blue":
    "bg-[rgb(191_227_255/0.16)] backdrop-blur-[22px] backdrop-saturate-[1.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] border border-[#bfe3ff]/70",
  "glass-pink":
    "bg-[rgb(255_158_196/0.14)] backdrop-blur-[22px] backdrop-saturate-[1.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] border border-[#ff9ec4]/60",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hoverLift = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Near-square corners (4px on cards)
          "rounded-[4px] text-ink relative overflow-hidden",
          variantStyles[variant],
          // Subtle hover lift
          hoverLift &&
            "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ease-out cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 pb-3", className)} {...props}>
        {children}
      </div>
    );
  }
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-heading text-xl font-normal leading-tight tracking-tight text-ink",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-6 pt-2 text-sm leading-relaxed", className)} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center p-6 pt-0 border-t border-[rgba(29,29,27,0.06)] mt-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = "CardFooter";

export default Card;
