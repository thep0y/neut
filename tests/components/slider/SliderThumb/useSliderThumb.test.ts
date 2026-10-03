import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useSliderThumb } from "~/components/slider/SliderThumb/useSliderThumb";
import { contextWrapper, fakeCtx } from "~tests/components/slider/test-utils";

/** 造一个键盘事件；只关心 key/shiftKey/preventDefault */
function keyEvent(
  key: string,
  options: { shiftKey?: boolean } = {},
): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    shiftKey: options.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
}

describe("useSliderThumb", () => {
  it("按索引取当前 thumb 的值", () => {
    const { result } = renderHook(() => useSliderThumb(1), {
      wrapper: contextWrapper(fakeCtx({ values: () => [10, 70] })),
    });

    expect(result.positionStyle()).toEqual({ "--position": "70%" });
  });

  it("索引越界时回退到 min（--position 落在起点 0%）", () => {
    const { result } = renderHook(() => useSliderThumb(5), {
      wrapper: contextWrapper(fakeCtx({ min: () => 25, values: () => [10] })),
    });

    expect(result.positionStyle()).toEqual({ "--position": "0%" });
  });

  it("--position 以 min 为基准偏移", () => {
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(
        fakeCtx({ min: () => 20, max: () => 120, values: () => [70] }),
      ),
    });

    expect(result.positionStyle()).toEqual({ "--position": "50%" });
  });

  it("横向：ArrowRight / ArrowUp 增大一步，ArrowLeft / ArrowDown 减小一步", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(fakeCtx({ values: () => [40], updateValue })),
    });

    result.handleKeyDown(keyEvent("ArrowRight"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 41);

    result.handleKeyDown(keyEvent("ArrowUp"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 41);

    result.handleKeyDown(keyEvent("ArrowLeft"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 39);

    result.handleKeyDown(keyEvent("ArrowDown"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 39);
  });

  it("按住 Shift 时步长放大 10 倍", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(
        fakeCtx({ step: () => 2, values: () => [40], updateValue }),
      ),
    });

    result.handleKeyDown(keyEvent("ArrowRight", { shiftKey: true }));

    expect(updateValue).toHaveBeenCalledWith(0, 60);
  });

  it("纵向：ArrowUp 增大、ArrowDown 减小，左右方向键不响应", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(
        fakeCtx({
          orientation: () => "vertical",
          values: () => [40],
          updateValue,
        }),
      ),
    });

    result.handleKeyDown(keyEvent("ArrowUp"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 41);

    result.handleKeyDown(keyEvent("ArrowDown"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 39);

    updateValue.mockClear();
    result.handleKeyDown(keyEvent("ArrowLeft"));
    result.handleKeyDown(keyEvent("ArrowRight"));
    expect(updateValue).not.toHaveBeenCalled();
  });

  it("Home / End 跳到 min / max", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(
        fakeCtx({
          min: () => 10,
          max: () => 90,
          values: () => [40],
          updateValue,
        }),
      ),
    });

    result.handleKeyDown(keyEvent("Home"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 10);

    result.handleKeyDown(keyEvent("End"));
    expect(updateValue).toHaveBeenLastCalledWith(0, 90);
  });

  it("方向键 / Home / End 都会阻止默认滚动行为", () => {
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(fakeCtx({ values: () => [40] })),
    });

    for (const key of ["ArrowRight", "Home", "End"]) {
      const event = keyEvent(key);
      result.handleKeyDown(event);
      expect(event.defaultPrevented, `${key} 应 preventDefault`).toBe(true);
    }
  });

  it("PageUp / PageDown 按 10 个 step 大步进退", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(
        fakeCtx({ values: () => [40], step: () => 2, updateValue }),
      ),
    });

    const up = keyEvent("PageUp");
    result.handleKeyDown(up);
    expect(updateValue).toHaveBeenLastCalledWith(0, 60);
    expect(up.defaultPrevented).toBe(true);

    const down = keyEvent("PageDown");
    result.handleKeyDown(down);
    expect(updateValue).toHaveBeenLastCalledWith(0, 20);
    expect(down.defaultPrevented).toBe(true);
  });

  it("无关按键不更新值、不阻止默认行为", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(fakeCtx({ values: () => [40], updateValue })),
    });
    const event = keyEvent("a");

    result.handleKeyDown(event);

    expect(updateValue).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("disabled 时任何按键都不响应", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderThumb(0), {
      wrapper: contextWrapper(
        fakeCtx({ disabled: () => true, values: () => [40], updateValue }),
      ),
    });
    const event = keyEvent("ArrowRight");

    result.handleKeyDown(event);

    expect(updateValue).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
