import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { DrawerClose } from "~/components/drawer/DrawerClose/DrawerClose";
import {
  drawerContextWrapper,
  fakeDrawerContext,
} from "~tests/components/drawer/test-utils";

function renderIn(
  ui: () => JSX.Element,
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
) {
  return render(ui, {
    wrapper: drawerContextWrapper(fakeDrawerContext(overrides)),
  });
}

describe("DrawerClose", () => {
  it("默认渲染 button，带 data-slot", () => {
    const { getByRole } = renderIn(() => <DrawerClose>关闭抽屉</DrawerClose>);
    const close = getByRole("button", { name: "关闭抽屉" });

    expect(close.tagName).toBe("BUTTON");
    expect(close).toHaveAttribute("data-slot", "drawer-close");
  });

  it("component 指定自定义标签时按该标签渲染", () => {
    const { getByRole } = renderIn(() => (
      <DrawerClose component="a" href="#drawer">
        关闭抽屉
      </DrawerClose>
    ));

    expect(getByRole("link", { name: "关闭抽屉" }).tagName).toBe("A");
  });

  it("点击时关闭抽屉，reason=close-press", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(() => <DrawerClose>关闭抽屉</DrawerClose>, {
      open: () => true,
      setOpen,
    });

    fireEvent.click(getByRole("button", { name: "关闭抽屉" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false, "close-press");
  });

  it("已关闭时点击仍回调关闭（根组件不重复回调由它自己保证）", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(() => <DrawerClose>关闭抽屉</DrawerClose>, {
      setOpen,
    });

    fireEvent.click(getByRole("button", { name: "关闭抽屉" }));

    expect(setOpen).toHaveBeenCalledWith(false, "close-press");
  });

  it("透传用户自己的 onClick", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    const { getByText } = renderIn(
      () => (
        <DrawerClose component="div" onClick={onClick}>
          关闭抽屉
        </DrawerClose>
      ),
      { setOpen },
    );

    fireEvent.click(getByText("关闭抽屉"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false, "close-press");
  });

  it("合并 ref：调用用户的 ref", () => {
    const userRef = vi.fn();
    const { getByRole } = renderIn(() => (
      <DrawerClose
        ref={(el) => {
          userRef(el);
        }}
      >
        关闭抽屉
      </DrawerClose>
    ));
    const close = getByRole("button", { name: "关闭抽屉" });

    expect(userRef).toHaveBeenCalledWith(close);
  });
});
