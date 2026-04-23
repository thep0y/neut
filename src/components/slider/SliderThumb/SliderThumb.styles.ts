import { clsx } from "~/utils";

export const classes = clsx(
  "absolute block size-3 shrink-0 rounded-full border border-neutral-400 dark:border-neutral-500 bg-white ring-neutral-400/50 dark:ring-neutral-500/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 data-[disabled=true]:pointer-events-none",
  "data-[orientation=horizontal]:-translate-1/2 data-[orientation=horizontal]:top-1/2 data-[orientation=horizontal]:left-(--position)",
  "data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:translate-y-1/2 data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:bottom-(--position)",
);
