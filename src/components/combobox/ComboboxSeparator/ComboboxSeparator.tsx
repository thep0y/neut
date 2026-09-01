import { clsx } from "~/utils";

export function ComboboxSeparator(props: { class?: string }) {
  return (
    <div
      data-slot="combobox-separator"
      class={clsx("-mx-1 my-1 h-px bg-border", props.class)}
    />
  );
}
