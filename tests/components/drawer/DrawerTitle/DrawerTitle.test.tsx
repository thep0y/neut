import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { DrawerTitle } from "~/components/drawer/DrawerTitle/DrawerTitle";
import {
  drawerContextWrapper,
  fakeDrawerContext,
} from "~tests/components/drawer/test-utils";

function renderTitle(
  props: Parameters<typeof DrawerTitle>[0] = {},
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
) {
  return render(() => <DrawerTitle {...props} />, {
    wrapper: drawerContextWrapper(fakeDrawerContext(overrides)),
  });
}

function title(): HTMLElement {
  return document.querySelector('[data-slot="drawer-title"]') as HTMLElement;
}

describe("DrawerTitle", () => {
  it("渲染 h2 标题，带 data-slot 与唯一 id", () => {
    renderTitle({ children: "标题" });

    expect(title().tagName).toBe("H2");
    expect(title()).toHaveAttribute("data-slot", "drawer-title");
    expect(title().id).toMatch(/^drawer-title-/);
  });

  it("挂载时把 id 注册给 context，卸载时清除", () => {
    const setTitleId = vi.fn();
    const { unmount } = renderTitle({ children: "标题" }, { setTitleId });

    expect(setTitleId).toHaveBeenLastCalledWith(title().id);

    unmount();

    expect(setTitleId).toHaveBeenLastCalledWith(undefined);
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    renderTitle({
      children: "标题",
      class: "my-title",
      classList: { "is-large": true },
      "data-testid": "title-extra",
    } as never);

    expect(title()).toHaveClass("my-title");
    expect(title()).toHaveClass("is-large");
    expect(title()).toHaveAttribute("data-testid", "title-extra");
  });

  it("脱离 Drawer 渲染时抛出中文错误", () => {
    expect(() => render(() => <DrawerTitle>标题</DrawerTitle>)).toThrow(
      "必须渲染在 <Drawer> 内部",
    );
  });
});
