import { For, splitProps, type JSX } from "solid-js";
import { PopoverContent } from "~/components/popover";
import { clsx } from "~/utils";
import { TimePickerColumn } from "../TimePickerColumn";
import { useTimePickerContext } from "../TimePicker/TimePicker.context";
import type { TimePickerContentProps } from "./TimePickerContent.types";

/**
 * TimePicker 的浮层:复用 <PopoverContent> 的定位/动画/外部点击与 Esc 关闭,
 * 内部按 `ctx.units()` 渲染各时间列。打开时把焦点移入第一列,键盘可直接操作。
 */
export function TimePickerContent(props: TimePickerContentProps): JSX.Element {
  const ctx = useTimePickerContext("TimePickerContent");
  const [local, rest] = splitProps(props, [
    "side",
    "align",
    "sideOffset",
    "class",
    "children",
  ]);

  // 列容器只在浮层打开时创建(PopoverContent 内部有 <Show> + Portal),
  // 因此 ref 回调恰好每次打开触发一次,可以安全地把焦点移入第一列。
  const focusFirstColumn = () => {
    requestAnimationFrame(() => {
      const first = ctx.units()[0];
      if (!first) return;
      ctx.setActiveUnit(first);
      ctx.getColumnElement(first)?.focus();
    });
  };

  return (
    <PopoverContent
      side={local.side ?? "bottom"}
      align={local.align ?? "start"}
      sideOffset={local.sideOffset}
      class={clsx("w-auto p-2", local.class)}
      {...rest}
    >
      <div
        ref={focusFirstColumn}
        data-slot="time-picker-columns"
        dir={ctx.dir()}
        class="flex items-start gap-1"
      >
        {local.children ?? (
          <For each={ctx.units()}>
            {(unit) => <TimePickerColumn unit={unit} />}
          </For>
        )}
      </div>
    </PopoverContent>
  );
}
