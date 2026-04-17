import { splitProps } from "solid-js";
import type { TextareaProps } from "./Textarea.types";
import { clsx } from "~/lib/utils";

export const Textarea = (props: TextareaProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <textarea
      data-slot="textarea"
      class={clsx(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-neutral-200 dark:border-white/15 bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:border-neutral-400 dark:focus-visible:border-neutral-500  focus-visible:ring-3 focus-visible:ring-neutral-400/50 dark:focus-visible:ring-neutral-500/50 disabled:cursor-not-allowed disabled:bg-neutral-200/50 disabled:opacity-50 aria-invalid:border-red-600 aria-invalid:ring-3 aria-invalid:ring-red-600/20 md:text-sm dark:bg-white/4.5 dark:disabled:bg-white/12 dark:aria-invalid:border-red-400/50 dark:aria-invalid:ring-red-400/40",
        local.class,
      )}
      {...others}
    />
  );
};
