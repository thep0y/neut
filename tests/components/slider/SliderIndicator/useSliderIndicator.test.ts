import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { useSliderIndicator } from "~/components/slider/SliderIndicator/useSliderIndicator";
import { contextWrapper, fakeCtx } from "~tests/components/slider/test-utils";

describe("useSliderIndicator", () => {
  it("单 thumb：起点固定为 0，终点为当前值的百分比", () => {
    const { result } = renderHook(() => useSliderIndicator(), {
      wrapper: contextWrapper(fakeCtx({ values: () => [30] })),
    });

    expect(result.indicatorStyle()).toEqual({
      "--start-position": "0%",
      "--relative-size": "30%",
    });
  });

  it("多 thumb：起点为首 thumb、终点为末 thumb", () => {
    const { result } = renderHook(() => useSliderIndicator(), {
      wrapper: contextWrapper(fakeCtx({ values: () => [20, 60] })),
    });

    expect(result.indicatorStyle()).toEqual({
      "--start-position": "20%",
      "--relative-size": "40%",
    });
  });

  it("百分比以 min 为基准偏移，而不是 0", () => {
    const { result } = renderHook(() => useSliderIndicator(), {
      wrapper: contextWrapper(
        fakeCtx({ min: () => 20, max: () => 120, values: () => [30, 70] }),
      ),
    });

    expect(result.indicatorStyle()).toEqual({
      "--start-position": "10%",
      "--relative-size": "40%",
    });
  });

  it("纵向：起点与尺寸两个变量对调", () => {
    const { result } = renderHook(() => useSliderIndicator(), {
      wrapper: contextWrapper(
        fakeCtx({ values: () => [20, 60], orientation: () => "vertical" }),
      ),
    });

    expect(result.indicatorStyle()).toEqual({
      "--start-position": "40%",
      "--relative-size": "20%",
    });
  });
});
