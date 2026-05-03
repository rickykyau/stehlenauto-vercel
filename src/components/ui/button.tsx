import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display uppercase tracking-[0.12em] text-xs font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-bold",
        secondary:
          "bg-transparent border border-border text-foreground hover:bg-surface-2 hover:border-border-2",
        ghost:
          "bg-transparent text-foreground hover:bg-surface-2",
        destructive:
          "bg-destructive text-foreground border border-destructive hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-[18px]",
        lg: "h-12 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), "rounded-md", className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
