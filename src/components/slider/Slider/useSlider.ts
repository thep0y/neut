import { createMemo, createSignal } from "solid-js";
import type { SliderProps } from "./Slider.types";
import type { NonNullableProps } from "~/types";

export const useSlider = ({
  local,
}: {
  local: NonNullableProps<
    Pick<
      SliderProps,
      | "defaultValue"
      | "value"
      | "max"
      | "min"
      | "step"
      | "orientation"
      | "onValueChange"
      | "disabled"
    >,
    "max" | "min" | "step" | "orientation" | "disabled"
  >;
}) => {
  // 受控 / 非受控模式
  const isControlled = () => local.value !== undefined;

  const initialValues = () => {
    if (Array.isArray(local.defaultValue)) return local.defaultValue;
    // 单 thumb 默认为 min，range 模式若传了 value 则交给 controlled
    return [local.min];
  };

  const [internalValues, setInternalValues] =
    createSignal<number[]>(initialValues());

  const values = createMemo<number[]>(() =>
    isControlled() ? (local.value as number[]) : internalValues(),
  );

  // 当前被拖拽的 thumb 索引
  const [activeThumbIndex, setActiveThumbIndex] = createSignal(0);

  // track DOM 引用（由 SliderTrack 注入）
  let trackEl: HTMLDivElement | undefined;
  const trackRef = () => trackEl;
  const setTrackRef = (el: HTMLDivElement) => {
    trackEl = el;
  };

  /** 从 step 推导需要保留的小数位数，例如 step=0.05 → 2 位 */
  const stepDecimals = createMemo(() => {
    const s = local.step.toString();
    const dot = s.indexOf(".");
    return dot === -1 ? 0 : s.length - dot - 1;
  });

  /** 将原始数值 snap 到 step 并 clamp 到 [min, max] */
  const snapValue = (raw: number) => {
    const { min, max, step } = local;
    const snapped = Math.round((raw - min) / step) * step + min;
    const fixed = parseFloat(snapped.toFixed(stepDecimals()));
    return Math.min(max, Math.max(min, fixed));
  };

  const updateValue = (index: number, rawValue: number) => {
    const next = values().slice();
    let snapped = snapValue(rawValue);

    // 防止 thumbs 交叉（多 thumb 场景）
    if (index > 0 && snapped <= next[index - 1]) {
      snapped = snapValue(next[index - 1] + local.step);
    }
    if (index < next.length - 1 && snapped >= next[index + 1]) {
      snapped = snapValue(next[index + 1] - local.step);
    }

    next[index] = snapped;

    if (!isControlled()) setInternalValues(next);
    local.onValueChange?.(next);
  };

  const context = {
    values,
    min: () => local.min,
    max: () => local.max,
    step: () => local.step,
    orientation: () => local.orientation,
    disabled: () => local.disabled,
    activeThumbIndex,
    setActiveThumbIndex,
    updateValue,
    trackRef,
    setTrackRef,
  };

  return { context };
};
