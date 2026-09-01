import type { JSX } from "solid-js";

export function ComboboxGroup(props: {
  children?: JSX.Element;
  class?: string;
}) {
  return (
    <div data-slot="combobox-group" class={props.class}>
      {props.children}
    </div>
  );
}
