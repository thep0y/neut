import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { SliderContext } from "~/components/slider/Slider/Slider.context";
import { SliderControl } from "~/components/slider/SliderControl";
import {
  type SliderCtx,
  fakeCtx,
  stubPointerCapture,
  stubRect,
} from "~tests/components/slider/test-utils";

/** 把组件放进假 Provider 里渲染 */
function wrapper(value: SliderCtx) {
  return (props: { children: JSX.Element }) => (
    <SliderContext.Provider value={value}>
      {props.children}
    </SliderContext.Provider>
  );
}

function control(container: HTMLElement): HTMLElement {
  return container.querySelector("div[data-disabled]") as HTMLElement;
}

describe("SliderControl", () => {
  it("写出 data-slot=slider-control", () => {
    const { container } = render(() => <SliderControl />, {
      wrapper: wrapper(fakeCtx({})),
    });

    expect(
      container.querySelector('[data-slot="slider-control"]'),
    ).not.toBeNull();
  });

  it("写出 orientation / disabled 的 data-* 状态", () => {
    const { container } = render(() => <SliderControl />, {
      wrapper: wrapper(
        fakeCtx({ orientation: () => "vertical", disabled: () => true }),
      ),
    });

    expect(control(container)).toHaveAttribute("data-orientation", "vertical");
    expect(control(container)).toHaveAttribute("data-disabled", "true");
  });

  it("disabled=false 时 data-disabled 为 false", () => {
    const { container } = render(() => <SliderControl />, {
      wrapper: wrapper(fakeCtx()),
    });

    expect(control(container)).toHaveAttribute("data-disabled", "false");
  });

  it("透传 class、classList 与其余属性", () => {
    const { container } = render(
      () => (
        <SliderControl
          class="my-control"
          classList={{ "is-dragging": true }}
          data-testid="control"
        />
      ),
      { wrapper: wrapper(fakeCtx()) },
    );

    expect(control(container)).toHaveClass("my-control");
    expect(control(container)).toHaveClass("is-dragging");
    expect(control(container)).toHaveAttribute("data-testid", "control");
  });

  it("pointerdown 接到真实换算：拖动控制条即更新 thumb", () => {
    const updateValue = vi.fn();
    const track = stubRect(document.createElement("div"), {
      left: 0,
      top: 0,
      width: 200,
      height: 10,
    });
    const { container } = render(() => <SliderControl />, {
      wrapper: wrapper(fakeCtx({ trackRef: () => track, updateValue })),
    });
    const element = control(container);
    stubPointerCapture(element);

    fireEvent.pointerDown(element, { button: 0, pointerId: 1, clientX: 100 });

    expect(updateValue).toHaveBeenCalledWith(0, 50);
  });

  it("disabled 时 pointerdown 不更新值", () => {
    const updateValue = vi.fn();
    const { container } = render(() => <SliderControl />, {
      wrapper: wrapper(fakeCtx({ disabled: () => true, updateValue })),
    });
    const element = control(container);
    stubPointerCapture(element);

    fireEvent.pointerDown(element, { button: 0, pointerId: 1, clientX: 100 });

    expect(updateValue).not.toHaveBeenCalled();
  });

  it("pointerup 释放已捕获的指针", () => {
    const captured = new Set<number>();
    const { container } = render(() => <SliderControl />, {
      wrapper: wrapper(fakeCtx()),
    });
    const element = control(container);
    Object.assign(element, {
      hasPointerCapture: (id: number) => captured.has(id),
      releasePointerCapture: (id: number) => captured.delete(id),
    });
    captured.add(5);

    fireEvent.pointerUp(element, { pointerId: 5 });

    expect(captured.has(5)).toBe(false);
  });
});
