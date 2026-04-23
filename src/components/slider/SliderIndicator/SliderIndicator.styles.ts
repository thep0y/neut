import { clsx } from "~/utils";

export const classes = clsx(
  "bg-neutral-900 dark:bg-neutral-200 select-none",
  "data-[orientation=horizontal]:relative data-[orientation=horizontal]:h-full data-[orientation=horizontal]:inset-s-(--start-position) data-[orientation=horizontal]:w-(--relative-size)",
  "data-[orientation=vertical]:absolute data-[orientation=vertical]:w-full data-[orientation=vertical]:h-(--start-position) data-[orientation=vertical]:bottom-(--relative-size)",
);
