import type { JSX } from "solid-js";
import { clsx } from "~/utils";

export function ComboboxLabel(props: {
  children?: JSX.Element;
  class?: string;
}) {
  return (
    <div
      data-slot="combobox-label"
      class={clsx("px-2 py-1.5 text-xs text-muted-foreground", props.class)}
    >
      {props.children}
    </div>
  );
}
