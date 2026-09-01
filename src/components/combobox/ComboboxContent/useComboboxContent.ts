import { createEffect, onCleanup } from "solid-js";
import { createPositioner, flip, hide, offset, shift, size } from "~/lib";
import { toPlacement } from "./ComboboxContent.utils";
import { useComboboxContext } from "../Combobox/Combobox.context";
import type { ComboboxContentProps } from "./ComboboxContent.types";

export const useComboboxContent = (
  local: () => Required<
    Pick<ComboboxContentProps, "side" | "align" | "alignOffset" | "sideOffset">
  >,
) => {
  const ctx = useComboboxContext("ComboboxContent");

  const pos = createPositioner(ctx.reference, ctx.floating, {
    placement: () => toPlacement(local().side, local().align),
    strategy: "fixed",
    middleware: () => [
      offset({
        mainAxis: local().sideOffset,
        crossAxis: local().alignOffset,
      }),
      flip(),
      shift({ padding: 8 }),
      size({ padding: 8 }),
      hide(),
    ],
  });

  const referenceWidth = () => ctx.reference()?.getBoundingClientRect().width;

  createEffect(() => {
    if (ctx.open()) pos.update();
  });

  createEffect(() => {
    if (!ctx.open()) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !ctx.reference()?.contains(target) &&
        !ctx.floating()?.contains(target)
      ) {
        ctx.close();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    onCleanup(() =>
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      }),
    );
  });

  const style = () => ({
    ...pos.floatingStyles(),
    "z-index": 1000,
    opacity: pos.isPositioned() ? 1 : 0,
    width: referenceWidth() ? `${referenceWidth()}px` : undefined,
  });

  return { ctx, style };
};
