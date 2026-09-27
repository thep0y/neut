import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { MarkerIconProps } from "./MarkerIcon.types";

/** 装饰性图标槽，对辅助技术隐藏（aria-hidden） */
export function MarkerIcon(props: MarkerIconProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <span
      {...rest}
      data-slot="marker-icon"
      aria-hidden="true"
      class={clsx(
        "size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
