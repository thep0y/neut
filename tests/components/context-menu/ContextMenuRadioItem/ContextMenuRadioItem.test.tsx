import { fireEvent } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenuRadioGroup } from "~/components/context-menu/ContextMenuRadioGroup/ContextMenuRadioGroup";
import { ContextMenuRadioItem } from "~/components/context-menu/ContextMenuRadioItem/ContextMenuRadioItem";
import { renderOpenMenu, slot, waitForMount } from "../test-utils";

function item(): HTMLElement {
  return slot("context-menu-radio-item")!;
}

function indicatorHasCheck(): boolean {
  return !!item().querySelector("svg");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContextMenuRadioItem - 渲染与 ARIA", () => {
  it("渲染 role=menuitemradio，未选中时 aria-checked=false + data-unchecked", () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup defaultValue="a">
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));

    expect(item()).toHaveAttribute("role", "menuitemradio");
    expect(item()).toHaveAttribute("aria-checked", "false");
    expect(item()).toHaveAttribute("data-unchecked", "");
    expect(indicatorHasCheck()).toBe(false);
  });

  it("选中时 aria-checked=true + data-checked 并渲染勾选图标", () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup defaultValue="a">
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));

    expect(item()).toHaveAttribute("aria-checked", "true");
    expect(item()).toHaveAttribute("data-checked", "");
    expect(item()).not.toHaveAttribute("data-unchecked");
    expect(indicatorHasCheck()).toBe(true);
  });

  it("inset 时带 data-inset", () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup>
        <ContextMenuRadioItem value="a" inset>
          浅色
        </ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));

    expect(item()).toHaveAttribute("data-inset", "");
  });
});

describe("ContextMenuRadioItem - 点击行为", () => {
  it("点击调用 group.setValue 且默认不关闭菜单", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuRadioGroup onValueChange={onValueChange}>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onValueChange).toHaveBeenCalledWith(
      "a",
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("context-menu-content")).toBeInTheDocument();
  });

  it("closeOnClick 时选中后关闭菜单", async () => {
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => (
        <ContextMenuRadioGroup>
          <ContextMenuRadioItem value="a" closeOnClick>
            浅色
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      ),
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "item-press" }),
    );
  });

  it("disabled 时点击不选中", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuRadioGroup onValueChange={onValueChange}>
        <ContextMenuRadioItem value="a" disabled>
          浅色
        </ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    expect(item()).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(item());

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("onClick 里 preventDefault 阻止选中", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuRadioGroup onValueChange={onValueChange}>
        <ContextMenuRadioItem
          value="a"
          onClick={(event) => event.preventDefault()}
        >
          浅色
        </ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("ContextMenuRadioItem - 字符导航与指针移动", () => {
  it("字符导航按文本匹配并高亮", async () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("context-menu-content")!, { key: "深" });

    expect(
      document.querySelectorAll('[data-slot="context-menu-radio-item"]')[1],
    ).toHaveAttribute("data-highlighted", "");
  });

  it("指针移入与移动都会高亮", async () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    const items = document.querySelectorAll(
      '[data-slot="context-menu-radio-item"]',
    );
    fireEvent.pointerEnter(items[1]!);
    expect(items[1]).toHaveAttribute("data-highlighted", "");

    fireEvent.pointerMove(items[0]!);
    expect(items[0]).toHaveAttribute("data-highlighted", "");
  });
});
