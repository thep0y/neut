import { fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenuCheckboxItem } from "~/components/context-menu/ContextMenuCheckboxItem/ContextMenuCheckboxItem";
import { renderOpenMenu, slot, waitForMount } from "../test-utils";

function item(): HTMLElement {
  return slot("context-menu-checkbox-item")!;
}

function indicatorHasCheck(): boolean {
  return !!item().querySelector("svg");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContextMenuCheckboxItem - 渲染与 ARIA", () => {
  it("渲染 role=menuitemcheckbox，未勾选时 aria-checked=false + data-unchecked", () => {
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem>书签栏</ContextMenuCheckboxItem>
    ));

    expect(item()).toHaveAttribute("role", "menuitemcheckbox");
    expect(item()).toHaveAttribute("aria-checked", "false");
    expect(item()).toHaveAttribute("data-unchecked", "");
    expect(item()).not.toHaveAttribute("data-checked");
    expect(indicatorHasCheck()).toBe(false);
  });

  it("defaultChecked 时初始勾选并渲染勾选图标", () => {
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem defaultChecked>书签栏</ContextMenuCheckboxItem>
    ));

    expect(item()).toHaveAttribute("aria-checked", "true");
    expect(item()).toHaveAttribute("data-checked", "");
    expect(item()).not.toHaveAttribute("data-unchecked");
    expect(indicatorHasCheck()).toBe(true);
  });

  it("inset 与 disabled 的样式/状态属性", () => {
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem inset disabled>
        书签栏
      </ContextMenuCheckboxItem>
    ));

    expect(item()).toHaveAttribute("data-inset", "");
    expect(item()).toHaveAttribute("data-disabled", "");
    expect(item()).toHaveAttribute("aria-disabled", "true");
  });
});

describe("ContextMenuCheckboxItem - 非受控", () => {
  it("点击切换勾选并回调事件详情，默认不关闭菜单", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem onCheckedChange={onCheckedChange}>
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(item()).toHaveAttribute("aria-checked", "true");
    expect(item()).toHaveAttribute("data-checked", "");
    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("context-menu-content")).toBeInTheDocument();
  });

  it("再次点击取消勾选", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem defaultChecked onCheckedChange={onCheckedChange}>
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(item()).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("事件详情带回菜单项元素作为 trigger", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem onCheckedChange={onCheckedChange}>
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    const details = onCheckedChange.mock.calls[0]![1] as { trigger: Element };
    expect(details.trigger).toBe(item());
  });

  it("closeOnClick 时切换后关闭菜单", async () => {
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => (
        <ContextMenuCheckboxItem closeOnClick>书签栏</ContextMenuCheckboxItem>
      ),
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("context-menu-content")).toBeNull();
  });

  it("disabled 时点击不切换", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem disabled onCheckedChange={onCheckedChange}>
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(item()).toHaveAttribute("aria-checked", "false");
  });

  it("onClick 里 preventDefault 阻止切换", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem
        onCheckedChange={onCheckedChange}
        onClick={(event) => event.preventDefault()}
      >
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(item()).toHaveAttribute("aria-checked", "false");
  });
});

describe("ContextMenuCheckboxItem - 受控", () => {
  it("受控下点击只回调，勾选状态由外部 checked 决定", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem
        checked={false}
        onCheckedChange={onCheckedChange}
      >
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(item()).toHaveAttribute("aria-checked", "false");
  });

  it("外部回写 checked 后 UI 跟随", async () => {
    const [checked, setChecked] = createSignal(false);
    renderOpenMenu(() => (
      <ContextMenuCheckboxItem checked={checked()}>
        书签栏
      </ContextMenuCheckboxItem>
    ));
    await waitForMount();

    expect(item()).toHaveAttribute("aria-checked", "false");

    setChecked(true);

    expect(item()).toHaveAttribute("aria-checked", "true");
    expect(item()).toHaveAttribute("data-checked", "");
  });
});

describe("ContextMenuCheckboxItem - 字符导航与指针移动", () => {
  it("字符导航按文本匹配并高亮", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuCheckboxItem>书签栏</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>状态栏</ContextMenuCheckboxItem>
      </>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("context-menu-content")!, { key: "状" });

    expect(
      document.querySelectorAll('[data-slot="context-menu-checkbox-item"]')[1],
    ).toHaveAttribute("data-highlighted", "");
  });

  it("指针移入与移动都会高亮", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuCheckboxItem>书签栏</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>状态栏</ContextMenuCheckboxItem>
      </>
    ));
    await waitForMount();

    const items = document.querySelectorAll(
      '[data-slot="context-menu-checkbox-item"]',
    );
    fireEvent.pointerEnter(items[1]!);
    expect(items[1]).toHaveAttribute("data-highlighted", "");

    fireEvent.pointerMove(items[0]!);
    expect(items[0]).toHaveAttribute("data-highlighted", "");
  });
});
