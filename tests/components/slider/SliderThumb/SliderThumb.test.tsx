import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { SliderContext } from "~/components/slider/Slider/Slider.context";
import { SliderThumb } from "~/components/slider/SliderThumb";
import { type SliderCtx, fakeCtx } from "~tests/components/slider/test-utils";

function wrapper(value: SliderCtx) {
  return (props: { children: JSX.Element }) => (
    <SliderContext.Provider value={value}>
      {props.children}
    </SliderContext.Provider>
  );
}

function thumb(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="slider-thumb"]') as HTMLElement;
}

describe("SliderThumb", () => {
  it("写出 data-slot / data-index / data-orientation", () => {
    const { container } = render(() => <SliderThumb index={1} />, {
      wrapper: wrapper(
        fakeCtx({ values: () => [20, 60], orientation: () => "vertical" }),
      ),
    });

    expect(thumb(container)).toHaveAttribute("data-slot", "slider-thumb");
    expect(thumb(container)).toHaveAttribute("data-index", "1");
    expect(thumb(container)).toHaveAttribute("data-orientation", "vertical");
  });

  it("带 slider 语义：role / aria-valuenow / valuemin / valuemax / orientation", () => {
    const { container } = render(() => <SliderThumb index={0} />, {
      wrapper: wrapper(
        fakeCtx({
          values: () => [30],
          min: () => 10,
          max: () => 90,
          orientation: () => "horizontal",
        }),
      ),
    });

    expect(thumb(container)).toHaveAttribute("role", "slider");
    expect(thumb(container)).toHaveAttribute("aria-valuenow", "30");
    expect(thumb(container)).toHaveAttribute("aria-valuemin", "10");
    expect(thumb(container)).toHaveAttribute("aria-valuemax", "90");
    expect(thumb(container)).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("纵向时 aria-orientation 跟着变，值随更新走", () => {
    const { container } = render(() => <SliderThumb index={1} />, {
      wrapper: wrapper(
        fakeCtx({ values: () => [20, 60], orientation: () => "vertical" }),
      ),
    });

    expect(thumb(container)).toHaveAttribute("aria-orientation", "vertical");
    expect(thumb(container)).toHaveAttribute("aria-valuenow", "60");
  });

  it("把 thumb 值换算成 --position 百分比", () => {
    const { container } = render(() => <SliderThumb index={1} />, {
      wrapper: wrapper(fakeCtx({ values: () => [20, 60] })),
    });

    expect(thumb(container).style.getPropertyValue("--position")).toBe("60%");
  });

  it("可用状态：可聚焦（tabindex=0）、aria-disabled=false、data-disabled=false", () => {
    const { container } = render(() => <SliderThumb index={0} />, {
      wrapper: wrapper(fakeCtx()),
    });

    expect(thumb(container)).toHaveAttribute("tabindex", "0");
    expect(thumb(container)).toHaveAttribute("aria-disabled", "false");
    expect(thumb(container)).toHaveAttribute("data-disabled", "false");
  });

  it("disabled：移出 tab 序列（tabindex=-1）并标记 aria-disabled/true", () => {
    const { container } = render(() => <SliderThumb index={0} />, {
      wrapper: wrapper(fakeCtx({ disabled: () => true })),
    });

    expect(thumb(container)).toHaveAttribute("tabindex", "-1");
    expect(thumb(container)).toHaveAttribute("aria-disabled", "true");
    expect(thumb(container)).toHaveAttribute("data-disabled", "true");
  });

  it("获得焦点时把 activeThumbIndex 切到自己", () => {
    const setActiveThumbIndex = vi.fn();
    const { container } = render(() => <SliderThumb index={1} />, {
      wrapper: wrapper(
        fakeCtx({ values: () => [20, 60], setActiveThumbIndex }),
      ),
    });

    fireEvent.focus(thumb(container));

    expect(setActiveThumbIndex).toHaveBeenCalledWith(1);
  });

  it("接上键盘处理：ArrowRight 增大当前 thumb 的值", () => {
    const updateValue = vi.fn();
    const { container } = render(() => <SliderThumb index={0} />, {
      wrapper: wrapper(fakeCtx({ values: () => [40], updateValue })),
    });

    fireEvent.keyDown(thumb(container), { key: "ArrowRight" });

    expect(updateValue).toHaveBeenCalledWith(0, 41);
  });

  it("透传 class、classList 与其余属性", () => {
    const { container } = render(
      () => (
        <SliderThumb
          index={0}
          class="my-thumb"
          classList={{ "is-active": true }}
          data-testid="thumb"
        />
      ),
      { wrapper: wrapper(fakeCtx()) },
    );

    expect(thumb(container)).toHaveClass("my-thumb");
    expect(thumb(container)).toHaveClass("is-active");
    expect(thumb(container)).toHaveAttribute("data-testid", "thumb");
  });
});
