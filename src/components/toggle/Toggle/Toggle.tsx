import {
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type JSX,
} from "solid-js";
import { clsx } from "~/utils";
import { toggleVariants } from "./Toggle.styles";
import type { ToggleProps } from "./Toggle.types";

export function Toggle(props: ToggleProps): JSX.Element {
  const merged = mergeProps({ type: "button" as const }, props);

  const [local, rest] = splitProps(merged, [
    "pressed",
    "defaultPressed",
    "onPressedChange",
    "variant",
    "size",
    "class",
    "value",
    "type",
    "onClick",
  ]);

  const [internalPressed, setInternalPressed] = createSignal(
    local.defaultPressed ?? false,
  );
  const pressed = createMemo(() =>
    local.pressed !== undefined ? local.pressed : internalPressed(),
  );

  const setPressed = (next: boolean) => {
    if (local.pressed === undefined) setInternalPressed(next);
    local.onPressedChange?.(next);
  };

  return (
    <button
      type={local.type as "button"}
      data-slot="toggle"
      data-state={pressed() ? "on" : "off"}
      aria-pressed={pressed()}
      class={clsx(
        toggleVariants({
          variant: local.variant,
          size: local.size,
          class: local.class,
        }),
      )}
      onClick={(e) => {
        // onClick 的类型是 JSX.EventHandlerUnion，含 Solid 的 [handler, data] 形式；
        // 直接 `.?(e)` 会让数组形式的 handler 静默失效（不抛错、状态也不翻转）
        const handler = local.onClick as
          | ((e: MouseEvent) => void)
          | [(data: unknown, e: MouseEvent) => void, unknown]
          | undefined;
        if (Array.isArray(handler)) handler[0](handler[1], e);
        else handler?.(e);
        if (!e.defaultPrevented) setPressed(!pressed());
      }}
      {...rest}
    />
  );
}
