import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { SliderContext } from "~/components/slider/Slider/Slider.context";
import { SliderIndicator } from "~/components/slider/SliderIndicator";
import { type SliderCtx, fakeCtx } from "~tests/components/slider/test-utils";

function wrapper(value: SliderCtx) {
  return (props: { children: JSX.Element }) => (
    <SliderContext.Provider value={value}>
      {props.children}
    </SliderContext.Provider>
  );
}

function indicator(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="slider-range"]') as HTMLElement;
}

describe("SliderIndicator", () => {
  it("写出 data-slot 与 data-orientation", () => {
    const { container } = render(() => <SliderIndicator />, {
      wrapper: wrapper(fakeCtx()),
    });

    expect(indicator(container)).toHaveAttribute("data-slot", "slider-range");
    expect(indicator(container)).toHaveAttribute(
      "data-orientation",
      "horizontal",
    );
  });

  it("横向 range：start/relative-size 由首尾 thumb 决定", () => {
    const { container } = render(() => <SliderIndicator />, {
      wrapper: wrapper(fakeCtx({ values: () => [20, 60] })),
    });

    expect(
      indicator(container).style.getPropertyValue("--start-position"),
    ).toBe("20%");
    expect(indicator(container).style.getPropertyValue("--relative-size")).toBe(
      "40%",
    );
  });

  it("纵向把两个变量对调，让 indicator 从底部起算", () => {
    const { container } = render(() => <SliderIndicator />, {
      wrapper: wrapper(
        fakeCtx({ values: () => [20, 60], orientation: () => "vertical" }),
      ),
    });

    expect(indicator(container).style.getPropertyValue("--relative-size")).toBe(
      "20%",
    );
    expect(
      indicator(container).style.getPropertyValue("--start-position"),
    ).toBe("40%");
  });

  it("透传 class、classList 与其余属性", () => {
    const { container } = render(
      () => (
        <SliderIndicator
          class="my-range"
          classList={{ "is-wide": true }}
          data-testid="range"
        />
      ),
      { wrapper: wrapper(fakeCtx()) },
    );

    expect(indicator(container)).toHaveClass("my-range");
    expect(indicator(container)).toHaveClass("is-wide");
    expect(indicator(container)).toHaveAttribute("data-testid", "range");
  });
});
