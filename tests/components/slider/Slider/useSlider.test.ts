import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useSlider } from "~/components/slider/Slider/useSlider";

type Local = Parameters<typeof useSlider>[0]["local"];

/** 只补齐必填项，其余用最常见默认值 */
const DEFAULT_LOCAL = {
  min: 0,
  max: 100,
  step: 1,
  orientation: "horizontal" as const,
  disabled: false,
};

/** 造一份完整的 local（必填项来自 DEFAULT_LOCAL，用例按需覆盖） */
function local(extra: Record<string, unknown> = {}): Local {
  return { ...DEFAULT_LOCAL, ...extra } as unknown as Local;
}

describe("useSlider", () => {
  it("既没有 value 也没有 defaultValue 时，值回退到 [min]", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ min: 10 }) }),
    );

    expect(result.context.values()).toEqual([10]);
    expect(result.context.min()).toBe(10);
  });

  it("单值 defaultValue 初始化内部状态，并暴露步长/上限/方向", () => {
    const { result } = renderHook(() =>
      useSlider({
        local: local({ defaultValue: 30, step: 5, orientation: "vertical" }),
      }),
    );

    expect(result.context.values()).toEqual([30]);
    expect(result.context.step()).toBe(5);
    expect(result.context.max()).toBe(100);
    expect(result.context.orientation()).toBe("vertical");
    expect(result.context.disabled()).toBe(false);
  });

  it("非受控单值：updateValue 写内部状态，并以数字形式回调", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlider({ local: local({ defaultValue: 30, onValueChange }) }),
    );

    result.context.updateValue(0, 55);

    expect(result.context.values()).toEqual([55]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(55);
  });

  it("非受控数组：updateValue 写内部状态，并以数组形式回调", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlider({
        local: local({ defaultValue: [10, 20], onValueChange }),
      }),
    );

    result.context.updateValue(1, 35);

    expect(result.context.values()).toEqual([10, 35]);
    expect(onValueChange).toHaveBeenCalledWith([10, 35]);
  });

  it("受控模式下 updateValue 只回调，不改内部状态", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlider({ local: local({ value: 20, onValueChange }) }),
    );

    result.context.updateValue(0, 50);

    expect(result.context.values()).toEqual([20]);
    expect(onValueChange).toHaveBeenCalledWith(50);
  });

  it("受控数组模式下 updateValue 只回调，不改内部状态", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlider({
        local: local({ value: [10, 80], onValueChange }),
      }),
    );

    result.context.updateValue(0, 40);

    expect(result.context.values()).toEqual([10, 80]);
    expect(onValueChange).toHaveBeenCalledWith([40, 80]);
  });

  it("没有 onValueChange 时更新值不报错", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ defaultValue: 0 }) }),
    );

    result.context.updateValue(0, 60);

    expect(result.context.values()).toEqual([60]);
  });

  it("snapValue 把原始值吸附到 step 并夹取到 [min, max]", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ step: 10 }) }),
    );

    result.context.updateValue(0, 23);
    expect(result.context.values()).toEqual([20]);

    result.context.updateValue(0, 999);
    expect(result.context.values()).toEqual([100]);

    result.context.updateValue(0, -999);
    expect(result.context.values()).toEqual([0]);
  });

  it("step 带小数时按 step 的小数位数取整，避免浮点尾巴", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ step: 0.05 }) }),
    );

    result.context.updateValue(0, 0.333);

    expect(result.context.values()).toEqual([0.35]);
  });

  it("多 thumb：后面的 thumb 不允许越过前一个（夹到前值 + 一步）", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlider({
        local: local({ defaultValue: [20, 60], onValueChange }),
      }),
    );

    result.context.updateValue(1, 10);

    expect(result.context.values()).toEqual([20, 21]);
    expect(onValueChange).toHaveBeenCalledWith([20, 21]);
  });

  it("多 thumb：前面的 thumb 不允许越过后一个（夹到后值 - 一步）", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ defaultValue: [20, 60] }) }),
    );

    result.context.updateValue(0, 90);

    expect(result.context.values()).toEqual([59, 60]);
  });

  it("多 thumb：不与相邻 thumb 冲突时按原始值落位", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ defaultValue: [20, 60] }) }),
    );

    result.context.updateValue(1, 90);

    expect(result.context.values()).toEqual([20, 90]);
  });

  it("trackRef 默认 undefined，setTrackRef 后能读回元素", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ defaultValue: 0 }) }),
    );
    expect(result.context.trackRef()).toBeUndefined();

    const track = document.createElement("div");
    result.context.setTrackRef(track);

    expect(result.context.trackRef()).toBe(track);
  });

  it("activeThumbIndex 默认 0，可被显式改写", () => {
    const { result } = renderHook(() =>
      useSlider({ local: local({ defaultValue: [10, 20] }) }),
    );
    expect(result.context.activeThumbIndex()).toBe(0);

    result.context.setActiveThumbIndex(1);

    expect(result.context.activeThumbIndex()).toBe(1);
  });
});
