import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700",
        outline:
          "border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md",
        secondary:
          "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md hover:shadow-lg hover:from-gray-700 hover:to-gray-800",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700",
        warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
