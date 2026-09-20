import { mergeProps, splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { callEventHandler } from "../call-event-handler";
import {
  createToggleGroupState,
  ToggleGroupContext,
} from "./ToggleGroup.context";
import { toggleGroupVariants } from "./ToggleGroup.styles";
import type { ToggleGroupProps } from "./ToggleGroup.types";
import { useToggleGroupKeyboard } from "./useToggleGroupKeyboard";

/**
 * ToggleGroup 根组件:渲染 `<div role="group">`,输出样式与语义钩子
 * (`data-orientation` / `data-vertical` / `data-horizontal` / `data-multiple`
 * / `data-disabled` / `data-spacing` / `data-variant` / `data-size`),
 * 并挂载 roving focus 键盘导航。
 *
 * @example
 * ```tsx
 * <ToggleGroup variant="outline" defaultValue={["bold"]}>
 *   <ToggleGroupItem value="bold" aria-label="Toggle bold">
 *     <Bold />
 *   </ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
export function ToggleGroup(props: ToggleGroupProps): JSX.Element {
  const merged = mergeProps(
    {
      multiple: false,
      disabled: false,
      orientation: "horizontal" as const,
      loopFocus: true,
      spacing: 2,
    },
    props,
  );

  const [local, rest] = splitProps(merged, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "orientation",
    "loopFocus",
    "spacing",
    "variant",
    "size",
    "class",
    "classList",
    "style",
    "dir",
    "onKeyDown",
    "children",
  ]);

  const ctx = createToggleGroupState(local);
  const { handleKeyDown } = useToggleGroupKeyboard(ctx);
  const isVertical = () => local.orientation === "vertical";

  return (
    <div
      role="group"
      data-slot="toggle-group"
      data-variant={local.variant}
      data-size={local.size}
      data-spacing={local.spacing}
      data-orientation={local.orientation}
      // 现有样式依赖 data-vertical / data-horizontal(与 tabs 根保持一致)
      data-vertical={isVertical() ? "" : null}
      data-horizontal={isVertical() ? null : ""}
      data-multiple={local.multiple ? "" : null}
      data-disabled={local.disabled ? "" : null}
      aria-disabled={local.disabled ? "true" : undefined}
      dir={local.dir}
      // --gap 作为 spacing 的样式入口,用户 style 可覆盖
      style={{ "--gap": local.spacing, ...local.style } as JSX.CSSProperties}
      class={clsx(toggleGroupVariants(), local.class)}
      classList={local.classList}
      onKeyDown={(e) => {
        callEventHandler(local.onKeyDown, e);
        if (!e.defaultPrevented) handleKeyDown(e);
      }}
      {...rest}
    >
      <ToggleGroupContext.Provider value={ctx}>
        {local.children}
      </ToggleGroupContext.Provider>
    </div>
  );
}
