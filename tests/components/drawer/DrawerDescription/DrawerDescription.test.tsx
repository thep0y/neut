import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { DrawerDescription } from "~/components/drawer/DrawerDescription/DrawerDescription";
import {
  drawerContextWrapper,
  fakeDrawerContext,
} from "~tests/components/drawer/test-utils";

function renderDescription(
  props: Parameters<typeof DrawerDescription>[0] = {},
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
) {
  return render(() => <DrawerDescription {...props} />, {
    wrapper: drawerContextWrapper(fakeDrawerContext(overrides)),
  });
}

function description(): HTMLElement {
  return document.querySelector(
    '[data-slot="drawer-description"]',
  ) as HTMLElement;
}

describe("DrawerDescription", () => {
  it("渲染 p 描述，带 data-slot 与唯一 id", () => {
    renderDescription({ children: "描述" });

    expect(description().tagName).toBe("P");
    expect(description()).toHaveAttribute("data-slot", "drawer-description");
    expect(description().id).toMatch(/^drawer-description-/);
  });

  it("挂载时把 id 注册给 context，卸载时清除", () => {
    const setDescriptionId = vi.fn();
    const { unmount } = renderDescription(
      { children: "描述" },
      { setDescriptionId },
    );

    expect(setDescriptionId).toHaveBeenLastCalledWith(description().id);

    unmount();

    expect(setDescriptionId).toHaveBeenLastCalledWith(undefined);
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    renderDescription({
      children: "描述",
      class: "my-description",
      classList: { "is-muted": true },
      "data-testid": "description-extra",
    } as never);

    expect(description()).toHaveClass("my-description");
    expect(description()).toHaveClass("is-muted");
    expect(description()).toHaveAttribute("data-testid", "description-extra");
  });

  it("脱离 Drawer 渲染时抛出中文错误", () => {
    expect(() =>
      render(() => <DrawerDescription>描述</DrawerDescription>),
    ).toThrow("必须渲染在 <Drawer> 内部");
  });
});
