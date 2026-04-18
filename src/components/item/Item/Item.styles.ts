import { cva } from "class-variance-authority";

export const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors duration-100 outline-none focus-visible:border-neutral-400 dark:focus-visible:border-neutral-500 focus-visible:ring-[3px] focus-visible:ring-neutral-400/50 dark:focus-visible:ring-neutral-500/50 [a]:transition-colors [a]:hover:bg-neutral-100 dark:[a]:hover:bg-neutral-800",
  {
    variants: {
      variant: {
        ghost: "border-transparent",
        outline: "border-neutral-200 dark:border-white/10",
        muted: "border-transparent bg-neutral-100/50 dark:bg-neutral-800/50",
      },
      size: {
        sm: "gap-2.5 px-3 py-2.5",
        xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "sm",
    },
  },
);
