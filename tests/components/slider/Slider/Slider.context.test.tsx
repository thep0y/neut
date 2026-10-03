import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { useSliderContext } from "~/components/slider/Slider";
import { contextWrapper, fakeCtx } from "~tests/components/slider/test-utils";

describe("useSliderContext", () => {
  it("脱离 Slider 渲染时抛出中文错误", () => {
    expect(() => renderHook(() => useSliderContext())).toThrow(
      "useSliderContext 必须用在 <Slider> 内部",
    );
  });

  it("在 Provider 内返回同一个 context 对象", () => {
    const value = fakeCtx({ min: () => 7 });

    const { result } = renderHook(() => useSliderContext(), {
      wrapper: contextWrapper(value),
    });

    expect(result).toBe(value);
    expect(result.min()).toBe(7);
  });
});
