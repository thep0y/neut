import { For, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { ScrollArrows } from "~/components/scroll-arrows";
import { TimePickerOption } from "../TimePickerOption";
import { useTimePickerContext } from "../TimePicker/TimePicker.context";
import type { TimePickerUnitValue } from "../TimePicker/TimePicker.types";
import type { TimePickerColumnProps } from "./TimePickerColumn.types";
import { useTimePickerColumn } from "./useTimePickerColumn";

/**
 * 单个时间列:`role="listbox"` 的可滚动列表,选项是 `role="option"`。
 *
 * 焦点停在列本身,`aria-activedescendant` 指向选中项;这样列表是唯一可聚焦的
 * 复合控件,方向键、Home/End、左右切换列都集中在 useTimePickerColumn 里。
 * 原生滚动条隐藏,用与 Select 一致的上下箭头提示还有内容。
 */
export function TimePickerColumn(props: TimePickerColumnProps): JSX.Element {
  const ctx = useTimePickerContext("TimePickerColumn");
  const {
    options,
    selected,
    activeOptionId,
    optionId,
    listElement,
    attachList,
  } = useTimePickerColumn(() => props);

  const selectOption = (
    value: TimePickerUnitValue,
    event: MouseEvent & { currentTarget: HTMLDivElement; target: Element },
  ) => {
    ctx.setUnitValue(props.unit, value, {
      reason: "option-press",
      event,
      trigger: event.currentTarget,
    });
  };

  return (
    // 外层只做相对定位,供滚动箭头贴住列表上下沿;自身不滚动
    <div
      data-slot="time-picker-column"
      data-unit={props.unit}
      class={clsx("relative flex flex-col", props.class)}
    >
      <div
        ref={attachList}
        role="listbox"
        aria-label={props.label ?? ctx.getUnitLabel(props.unit)}
        aria-activedescendant={activeOptionId()}
        tabIndex={0}
        class={clsx(
          "h-52 w-12 overflow-y-auto overscroll-contain rounded-md p-1",
          "no-scrollbar [&::-webkit-scrollbar]:hidden",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        )}
      >
        <For each={options()}>
          {(option) => (
            <TimePickerOption
              id={optionId(option.value)}
              value={option.value}
              selected={selected() === option.value}
              onSelect={(event) => {
                if (event) selectOption(option.value, event);
              }}
            >
              {option.label}
            </TimePickerOption>
          )}
        </For>
      </div>
      <ScrollArrows
        target={listElement}
        upClass="rounded-t-md"
        downClass="rounded-b-md"
      />
    </div>
  );
}
