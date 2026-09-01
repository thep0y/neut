import { createSignal } from "solid-js";

export function useComboboxAnchor() {
  return createSignal<HTMLElement | undefined>();
}
