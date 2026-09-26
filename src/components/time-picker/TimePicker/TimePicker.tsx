import { Show, children, type JSX, type ParentProps } from "solid-js";
import { Popover } from "~/components/popover";
import { TimePickerContent } from "../TimePickerContent";
import { TimePickerTrigger } from "../TimePickerTrigger";
import { TimePickerContext, createTimePickerState } from "./TimePicker.context";
import type { TimePickerProps } from "./TimePicker.types";

/**
 * 在 Provider 内部解析 children:必须放在 Provider 的子树里,
 * 否则 `children()` 的 memo 会捕获 Provider 之前的 owner,
 * 导致其中的 <TimePickerTrigger>/<TimePickerContent> 读不到 Context。
 */
function TimePickerSlots(props: ParentProps): JSX.Element {
  const resolved = children(() => props.children);
  return (
    <Show
      when={resolved()}
      fallback={
        <>
          <TimePickerTrigger />
          <TimePickerContent />
        </>
      }
    >
      {resolved()}
    </Show>
  );
}

/**
 * TimePicker 根组件:不渲染任何 DOM,只负责时间状态 + 提供 Context,
 * 并用 Popover 承载浮层。默认渲染 <TimePickerTrigger> + <TimePickerContent>,
 * 需要自定义时传入自己的子组件即可(例如替换触发器或列布局)。
 *
 * 时间列由 `hourCycle` / `showSeconds` / 步长决定:24h 显示 时/分,12h 额外显示 AM/PM,
 * `showSeconds` 时插入秒列。
 *
 * @example
 * ```tsx
 * // 开箱即用
 * <TimePicker value={time()} onValueChange={(v) => setTime(v)} />
 *
 * // 组合式
 * <TimePicker value={time()} onValueChange={(v) => setTime(v)} hourCycle={12}>
 *   <TimePickerTrigger />
 *   <TimePickerContent />
 * </TimePicker>
 * ```
 */
export function TimePicker(props: TimePickerProps): JSX.Element {
  const ctx = createTimePickerState(props);

  return (
    <TimePickerContext.Provider value={ctx}>
      <Popover
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        disabled={props.disabled}
      >
        <TimePickerSlots>{props.children}</TimePickerSlots>
      </Popover>
    </TimePickerContext.Provider>
  );
}
