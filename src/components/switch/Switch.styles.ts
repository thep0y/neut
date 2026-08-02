import { clsx } from "~/utils";

export const classes = {
  switch: clsx(
    // "relative inline-flex shrink-0 items-center after:absolute after:-inset-x-3 after:-inset-y-2",
    // "rounded-full border border-transparent focus-visible:border-neutral-400 dark:focus-visible:border-neutral-500 aria-invalid:border-red-600 dark:aria-invalid:border-red-400/50",
    // "focus-visible:ring-neutral-400/50 dark:focus-visible:ring-neutral-500/50 aria-invalid:ring-red-600/20 dark:aria-invalid:ring-red-400/40 data-[checked=true]:bg-neutral-900 dark:data-[checked=true]:bg-neutral-200 data-[checked=false]:bg-neutral-200 dark:data-[checked=false]:bg-white/12",
    // "data-[size=md]:h-[18.4px] data-[size=md]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6",
    // "peer group/switch transition-all outline-none focus-visible:ring-3 aria-invalid:ring-3 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none",
    "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=md]:h-[18.4px] data-[size=md]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[checked=true]:bg-primary data-[checked=false]:bg-input dark:data-[checked=false]:bg-input/80 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none",
  ),
  thumb: clsx(
    // "pointer-events-none",
    // "block",
    // "rounded-full",
    // "ring-0",
    // "transition-transform",
    // "group-data-[size=md]/switch:size-4 group-data-[size=sm]/switch:size-3",
    // "group-data-[size=md]/switch:data-[checked=true]:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-[checked=true]:translate-x-[calc(100%-2px)] group-data-[size=md]/switch:data-[checked=false]:translate-x-0 group-data-[size=sm]/switch:data-[checked=false]:translate-x-0",
    // "bg-white dark:bg-neutral-950 dark:data-[checked=true]:bg-neutral-900 dark:data-[checked=false]:bg-neutral-50",
    "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=md]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=md]/switch:data-[checked=true]:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-[checked=true]:translate-x-[calc(100%-2px)] dark:data-[checked=true]:bg-primary-foreground group-data-[size=md]/switch:data-[checked=false]:translate-x-0 group-data-[size=sm]/switch:data-[checked=false]:translate-x-0 dark:data-[checked=false]:bg-foreground",
  ),
} as const;
