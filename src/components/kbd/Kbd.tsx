import { splitProps } from "solid-js";
import type { KbdGroupProps, KbdProps } from "./Kbd.types";
import { clsx } from "~/utils";

export const Kbd = (props: KbdProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  //         "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
  return (
    <kbd
      data-slot="kbd"
      class={clsx(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 px-1 font-sans text-xs font-medium text-neutral-500 dark:text-neutral-400 select-none in-data-[slot=tooltip-content]:bg-white/20 in-data-[slot=tooltip-content]:text-white dark:in-data-[slot=tooltip-content]:text-neutral-950 dark:in-data-[slot=tooltip-content]:bg-neutral-950/10 [&_svg:not([class*='size-'])]:size-3",
        local.class,
      )}
      {...others}
    />
  );
};

export const KbdGroup = (props: KbdGroupProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <kbd
      data-slot="kbd-group"
      class={clsx("inline-flex items-center gap-1", local.class)}
      {...others}
    />
  );
};
