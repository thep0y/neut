import { mergeProps, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { clsx } from "~/utils";
import { markerVariants } from "./Marker.styles";
import type { MarkerProps } from "./Marker.types";

/**
 * 会话中的行内标记：状态、系统提示、带下边框的行、或带标签的分隔条。
 * 多态渲染（默认 div，可换 button/a）；展示型可加 `role="status"`。
 */
export const Marker = <T extends ValidComponent = "div">(
  props: MarkerProps<T>,
) => {
  const merged = mergeProps(
    { variant: "default", component: "div" } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "component",
    "class",
    "classList",
  ]);

  return (
    <Dynamic
      {...rest}
      component={local.component as ValidComponent}
      data-slot="marker"
      data-variant={local.variant}
      class={clsx(markerVariants({ variant: local.variant }), local.class)}
      classList={local.classList}
    />
  );
};
