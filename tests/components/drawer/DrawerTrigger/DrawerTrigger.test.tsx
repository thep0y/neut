import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { DrawerTrigger } from "~/components/drawer/DrawerTrigger/DrawerTrigger";
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

describe("DrawerTrigger - 渲染与多态", () => {
  it("默认渲染 button，带 data-slot 与 aria-haspopup", () => {
    const { getByRole } = renderIn(() => (
      <DrawerTrigger>打开抽屉</DrawerTrigger>
    ));
    const trigger = getByRole("button", { name: "打开抽屉" });

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("data-slot", "drawer-trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("component 指定自定义标签时按该标签渲染并保留契约属性", () => {
    const { getByRole } = renderIn(() => (
      <DrawerTrigger component="a" href="#drawer">
        打开抽屉
      </DrawerTrigger>
    ));
    const trigger = getByRole("link", { name: "打开抽屉" });

    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("data-slot", "drawer-trigger");
  });

  it("透传用户自己的 onClick，不被内部监听覆盖", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    const { getByText } = renderIn(
      () => (
        <DrawerTrigger component="div" onClick={onClick}>
          打开抽屉
        </DrawerTrigger>
      ),
      { setOpen },
    );

    fireEvent.click(getByText("打开抽屉"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true, "trigger-press");
  });

  it("把元素通过 ref 交给调用方，并注册为 context 的 trigger", () => {
    const userRef = vi.fn();
    const setTrigger = vi.fn();
    const { getByRole } = renderIn(
      () => (
        <DrawerTrigger
          ref={(el) => {
            userRef(el);
          }}
        >
          打开抽屉
        </DrawerTrigger>
      ),
      { setTrigger },
    );
    const trigger = getByRole("button", { name: "打开抽屉" });

    expect(userRef).toHaveBeenCalledWith(trigger);
    expect(setTrigger).toHaveBeenCalledWith(trigger);
  });
});

describe("DrawerTrigger - 开关状态", () => {
  it("关闭时 aria-expanded=false、data-state=closed，不输出 aria-controls", () => {
    const { getByRole } = renderIn(
      () => <DrawerTrigger>打开抽屉</DrawerTrigger>,
      { open: () => false },
    );
    const trigger = getByRole("button", { name: "打开抽屉" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(trigger).not.toHaveAttribute("aria-controls");
  });

  it("打开时 aria-expanded=true、data-state=open，aria-controls 指向 contentId", () => {
    const { getByRole } = renderIn(
      () => <DrawerTrigger>打开抽屉</DrawerTrigger>,
      { open: () => true, contentId: "drawer-content-42" },
    );
    const trigger = getByRole("button", { name: "打开抽屉" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("data-state", "open");
    expect(trigger).toHaveAttribute("aria-controls", "drawer-content-42");
  });

  it("点击时打开抽屉，reason=trigger-press", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <DrawerTrigger>打开抽屉</DrawerTrigger>,
      { setOpen },
    );

    fireEvent.click(getByRole("button", { name: "打开抽屉" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true, "trigger-press");
  });

  it("已打开时点击不再重复打开", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <DrawerTrigger>打开抽屉</DrawerTrigger>,
      { open: () => true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "打开抽屉" }));

    expect(setOpen).not.toHaveBeenCalled();
  });
});
