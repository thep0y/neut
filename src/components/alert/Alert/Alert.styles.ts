import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        outline:
          "bg-white text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50",
        destructive:
          "bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 *:data-[slot=alert-description]:text-red-600/90 dark:*:data-[slot=alert-description]:text-red-400/90 [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);
