import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { DrawerSwipeHandle } from "~/components/drawer/DrawerSwipeHandle/DrawerSwipeHandle";
import {
  drawerContextWrapper,
  fakeDrawerContext,
} from "~tests/components/drawer/test-utils";

function renderHandle(
  props: Parameters<typeof DrawerSwipeHandle>[0] = {},
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
) {
  return render(() => <DrawerSwipeHandle {...props} />, {
    wrapper: drawerContextWrapper(fakeDrawerContext(overrides)),
  });
}

function handle(): HTMLElement {
  return document.querySelector(
    '[data-slot="drawer-swipe-handle"]',
  ) as HTMLElement;
}

describe("DrawerSwipeHandle", () => {
  it("渲染 aria-hidden 的把手，并带 data-slot", () => {
    renderHandle();

    expect(handle()).toHaveAttribute("data-slot", "drawer-swipe-handle");
    expect(handle()).toHaveAttribute("aria-hidden", "true");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    renderHandle({
      class: "my-handle",
      classList: { "is-active": true },
      "data-testid": "handle-extra",
    } as never);

    expect(handle()).toHaveClass("my-handle");
    expect(handle()).toHaveClass("is-active");
    expect(handle()).toHaveAttribute("data-testid", "handle-extra");
  });

  it("脱离 Drawer 渲染时抛出中文错误", () => {
    expect(() => render(() => <DrawerSwipeHandle />)).toThrow(
      "必须渲染在 <Drawer> 内部",
    );
  });
});
