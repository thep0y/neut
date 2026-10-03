import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { SliderContext } from "~/components/slider/Slider/Slider.context";
import { SliderTrack } from "~/components/slider/SliderTrack";
import { type SliderCtx, fakeCtx } from "~tests/components/slider/test-utils";

function wrapper(value: SliderCtx) {
  return (props: { children: JSX.Element }) => (
    <SliderContext.Provider value={value}>
      {props.children}
    </SliderContext.Provider>
  );
}

function track(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="slider-track"]') as HTMLElement;
}

describe("SliderTrack", () => {
  it("写出 data-slot 与 data-orientation", () => {
    const { container } = render(() => <SliderTrack />, {
      wrapper: wrapper(fakeCtx({ orientation: () => "vertical" })),
    });

    expect(track(container)).toHaveAttribute("data-slot", "slider-track");
    expect(track(container)).toHaveAttribute("data-orientation", "vertical");
  });

  it("挂载时把自身注册到 context.trackRef", () => {
    const setTrackRef = vi.fn();
    const { container } = render(() => <SliderTrack />, {
      wrapper: wrapper(fakeCtx({ setTrackRef })),
    });

    expect(setTrackRef).toHaveBeenCalledTimes(1);
    expect(setTrackRef.mock.calls[0]?.[0]).toBe(track(container));
  });

  it("透传 class、classList 与其余属性", () => {
    const { container } = render(
      () => (
        <SliderTrack
          class="my-track"
          classList={{ "is-full": true, "is-empty": false }}
          data-testid="track"
        />
      ),
      { wrapper: wrapper(fakeCtx()) },
    );

    expect(track(container)).toHaveClass("my-track");
    expect(track(container)).toHaveClass("is-full");
    expect(track(container)).not.toHaveClass("is-empty");
    expect(track(container)).toHaveAttribute("data-testid", "track");
  });
});
