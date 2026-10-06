import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { DrawerOverlay } from "~/components/drawer/DrawerOverlay/DrawerOverlay";
import {
  drawerContextWrapper,
  fakeDrawerContext,
} from "~tests/components/drawer/test-utils";

function renderOverlay(
  props: Parameters<typeof DrawerOverlay>[0] = {},
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
) {
  return render(() => <DrawerOverlay {...props} />, {
    wrapper: drawerContextWrapper(fakeDrawerContext(overrides)),
  });
}

function overlay(): HTMLElement {
  return document.querySelector('[data-slot="drawer-overlay"]') as HTMLElement;
}

describe("DrawerOverlay - 渲染", () => {
  it("渲染 aria-hidden 的装饰层，并带 data-slot", () => {
    renderOverlay();

    expect(overlay()).toHaveAttribute("data-slot", "drawer-overlay");
    expect(overlay()).toHaveAttribute("aria-hidden", "true");
  });

  it("data-state 跟随开关：打开 open、关闭 closed", () => {
    const { unmount } = renderOverlay(undefined, { open: () => true });
    expect(overlay()).toHaveAttribute("data-state", "open");

    unmount();
    renderOverlay(undefined, { open: () => false });
    expect(overlay()).toHaveAttribute("data-state", "closed");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    renderOverlay({
      class: "my-overlay",
      classList: { "is-visible": true, "is-hidden": false },
      "data-testid": "overlay-extra",
    } as never);

    expect(overlay()).toHaveClass("my-overlay");
    expect(overlay()).toHaveClass("is-visible");
    expect(overlay()).not.toHaveClass("is-hidden");
    expect(overlay()).toHaveAttribute("data-testid", "overlay-extra");
  });
});

describe("DrawerOverlay - 点击关闭", () => {
  it("遮罩只转发调用方的 onClick，不再自己请求关闭（避免与根组件重复回调）", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    renderOverlay({ onClick } as never, { open: () => true, setOpen });

    fireEvent.click(overlay());

    expect(onClick).toHaveBeenCalledTimes(1);
    // 关闭统一由 Drawer 根组件在 document 上的 pointerdown 捕获处理
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("没有传 onClick 时点击遮罩不会报错，也不会自己关闭", () => {
    const setOpen = vi.fn();
    renderOverlay(undefined, { open: () => true, setOpen });

    expect(() => fireEvent.click(overlay())).not.toThrow();
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("disablePointerDismissal=true 时只调用用户 onClick，不关闭", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    renderOverlay({ onClick } as never, {
      open: () => true,
      disablePointerDismissal: () => true,
      setOpen,
    });

    fireEvent.click(overlay());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).not.toHaveBeenCalled();
  });
});
