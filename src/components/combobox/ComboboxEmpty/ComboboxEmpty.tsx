import type { JSX } from "solid-js";
import { clsx } from "~/utils";

export function ComboboxEmpty(props: {
  children?: JSX.Element;
  class?: string;
}) {
  return (
    <div
      data-slot="combobox-empty"
      class={clsx(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground",
        props.class,
      )}
    >
      {props.children}
    </div>
  );
}
