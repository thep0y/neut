import { clsx } from "~/lib/utils";

export const classes = clsx(
  "flex items-center gap-2 rounded-lg border bg-neutral-100 dark:bg-neutral-800 px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
);
