import type { ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Button } from "~/components/button";
import { useDialogTrigger } from "~/components/dialog";
import { mergeRefs } from "~/utils";
import type { SheetTriggerProps } from "../sheet.types";

/**
 * 复用 Dialog 的 trigger 逻辑(多态、disabled、aria-haspopup/expanded/state),
 * 只替换 `data-slot`。
 */
export const SheetTrigger = <
  T extends ValidComponent = typeof Button<"button">,
>(
  props: SheetTriggerProps<T>,
) => {
  const { open, isDisabled, attachListeners } = useDialogTrigger(() => props);

  return (
    <Dynamic
      {...props}
      component={(props.component as ValidComponent) ?? Button<"button">}
      ref={mergeRefs(props.ref, attachListeners)}
      disabled={isDisabled()}
      data-slot="sheet-trigger"
      aria-haspopup="dialog"
      aria-expanded={open()}
      data-state={open() ? "open" : "closed"}
    />
  );
};
