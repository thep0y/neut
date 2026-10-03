import { renderHook } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSliderControl } from "~/components/slider/SliderControl/useSliderControl";
import {
  contextWrapper,
  fakeCtx,
  pointerEvent,
  stubPointerCapture,
  stubRect,
} from "~tests/components/slider/test-utils";

/** 造一个以 `el` 为 currentTarget 的 pointer 事件（jsdom 不设这个只读属性） */
function pointerOn(
  type: string,
  el: HTMLElement,
  init: Parameters<typeof pointerEvent>[1] = {},
): PointerEvent {
  const event = pointerEvent(type, init);
  Object.defineProperty(event, "currentTarget", { value: el });
  return event;
}

let element: HTMLDivElement;

beforeEach(() => {
  element = document.createElement("div");
  stubPointerCapture(element);
});

describe("useSliderControl", () => {
  it("横向：按 track 矩形把 clientX 换算成数值，并更新最近的 thumb", () => {
    const track = stubRect(document.createElement("div"), {
      left: 0,
      top: 0,
      width: 200,
      height: 10,
    });
    const updateValue = vi.fn();
    const setActiveThumbIndex = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(
        fakeCtx({
          trackRef: () => track,
          updateValue,
          setActiveThumbIndex,
        }),
      ),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { clientX: 50 }),
    );

    expect(updateValue).toHaveBeenCalledWith(0, 25);
    expect(setActiveThumbIndex).toHaveBeenCalledWith(0);
  });

  it("横向：clientX 超出右边界时换算值大于 max（由 updateValue 负责夹取）", () => {
    const track = stubRect(document.createElement("div"), {
      left: 100,
      top: 0,
      width: 200,
      height: 10,
    });
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(fakeCtx({ trackRef: () => track, updateValue })),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { clientX: 400 }),
    );

    expect(updateValue).toHaveBeenCalledWith(0, 150);
  });

  it("纵向：底部为 min、顶部为 max，按 clientY 换算", () => {
    const track = stubRect(document.createElement("div"), {
      left: 0,
      top: 0,
      width: 10,
      height: 200,
    });
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(
        fakeCtx({
          orientation: () => "vertical",
          trackRef: () => track,
          updateValue,
        }),
      ),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { clientY: 50 }),
    );

    expect(updateValue).toHaveBeenCalledWith(0, 75);
  });

  it("track 尚未注册时退回到 min", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(
        fakeCtx({ min: () => 10, trackRef: () => undefined, updateValue }),
      ),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { clientX: 50 }),
    );

    expect(updateValue).toHaveBeenCalledWith(0, 10);
  });

  it("多 thumb：点击位置离哪个 thumb 的值更近就更新哪一个", () => {
    const track = stubRect(document.createElement("div"), {
      left: 0,
      top: 0,
      width: 100,
      height: 10,
    });
    const updateValue = vi.fn();
    const setActiveThumbIndex = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(
        fakeCtx({
          values: () => [20, 60],
          trackRef: () => track,
          updateValue,
          setActiveThumbIndex,
        }),
      ),
    });

    // clientX=85 → 值 85，离 60 更近（差 25）而不是 20（差 65）
    result.handlePointerDown(
      pointerOn("pointerdown", element, { clientX: 85 }),
    );

    expect(setActiveThumbIndex).toHaveBeenCalledWith(1);
    expect(updateValue).toHaveBeenCalledWith(1, 85);
  });

  it("disabled 时 pointerdown 不换算、不选中、不捕获指针", () => {
    const captured = stubPointerCapture(element);
    const updateValue = vi.fn();
    const setActiveThumbIndex = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(
        fakeCtx({
          disabled: () => true,
          updateValue,
          setActiveThumbIndex,
        }),
      ),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { clientX: 50 }),
    );

    expect(updateValue).not.toHaveBeenCalled();
    expect(setActiveThumbIndex).not.toHaveBeenCalled();
    expect(captured.size).toBe(0);
  });

  it("非主键（右键）pointerdown 被忽略", () => {
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(fakeCtx({ updateValue })),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { button: 2, clientX: 50 }),
    );

    expect(updateValue).not.toHaveBeenCalled();
  });

  it("pointerdown 成功后捕获指针，pointerup 释放捕获", () => {
    const captured = stubPointerCapture(element);
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(fakeCtx()),
    });

    result.handlePointerDown(
      pointerOn("pointerdown", element, { pointerId: 7, clientX: 50 }),
    );
    expect(captured.has(7)).toBe(true);

    result.handlePointerUp(pointerOn("pointerup", element, { pointerId: 7 }));
    expect(captured.has(7)).toBe(false);
  });

  it("pointerup 在未捕获时是空操作", () => {
    const captured = stubPointerCapture(element);
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(fakeCtx()),
    });

    result.handlePointerUp(pointerOn("pointerup", element, { pointerId: 3 }));

    expect(captured.size).toBe(0);
  });

  it("pointermove 只在捕获后生效，并按当前 activeThumbIndex 更新", () => {
    const captured = stubPointerCapture(element);
    const track = stubRect(document.createElement("div"), {
      left: 0,
      top: 0,
      width: 200,
      height: 10,
    });
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(
        fakeCtx({
          values: () => [20, 60],
          activeThumbIndex: () => 1,
          trackRef: () => track,
          updateValue,
        }),
      ),
    });

    // 未捕获 → 不处理
    result.handlePointerMove(
      pointerOn("pointermove", element, { clientX: 40 }),
    );
    expect(updateValue).not.toHaveBeenCalled();

    captured.add(1);
    result.handlePointerMove(
      pointerOn("pointermove", element, { pointerId: 1, clientX: 40 }),
    );

    expect(updateValue).toHaveBeenCalledWith(1, 20);
  });

  it("disabled 时 pointermove 即使已捕获也不更新", () => {
    const captured = stubPointerCapture(element);
    captured.add(1);
    const updateValue = vi.fn();
    const { result } = renderHook(() => useSliderControl(), {
      wrapper: contextWrapper(fakeCtx({ disabled: () => true, updateValue })),
    });

    result.handlePointerMove(
      pointerOn("pointermove", element, { pointerId: 1, clientX: 40 }),
    );

    expect(updateValue).not.toHaveBeenCalled();
  });
});
