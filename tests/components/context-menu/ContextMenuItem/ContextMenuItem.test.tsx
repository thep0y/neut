import { fireEvent } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenuItem } from "~/components/context-menu/ContextMenuItem/ContextMenuItem";
import { renderOpenMenu, slot, slots, waitForMount } from "../test-utils";

function item(): HTMLElement {
  return slot("context-menu-item")!;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContextMenuItem - 渲染与 ARIA", () => {
  it("渲染 role=menuitem，可聚焦但 tabIndex=-1（焦点留在浮层上）", () => {
    renderOpenMenu(() => <ContextMenuItem>复制</ContextMenuItem>);

    expect(item()).toHaveAttribute("role", "menuitem");
    expect(item()).toHaveAttribute("tabindex", "-1");
    expect(item()).toHaveAttribute("data-slot", "context-menu-item");
    expect(item()).toHaveTextContent("复制");
  });

  it("默认 variant=default，inset 时带 data-inset", () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuItem>默认</ContextMenuItem>
        <ContextMenuItem inset variant="destructive">
          危险
        </ContextMenuItem>
      </>
    ));

    const items = slots("context-menu-item");
    expect(items[0]).toHaveAttribute("data-variant", "default");
    expect(items[0]).not.toHaveAttribute("data-inset");
    expect(items[1]).toHaveAttribute("data-variant", "destructive");
    expect(items[1]).toHaveAttribute("data-inset", "");
  });

  it("disabled 时暴露 aria-disabled 与 data-disabled", () => {
    renderOpenMenu(() => <ContextMenuItem disabled>删除</ContextMenuItem>);

    expect(item()).toHaveAttribute("aria-disabled", "true");
    expect(item()).toHaveAttribute("data-disabled", "");
  });
});

describe("ContextMenuItem - 点击与关闭", () => {
  it("点击调用 onClick 并默认以 item-press 关闭菜单", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => <ContextMenuItem onClick={onClick}>复制</ContextMenuItem>,
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("context-menu-content")).toBeNull();
  });

  it("onClick 里 preventDefault 可阻止关闭", async () => {
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => (
        <ContextMenuItem
          onClick={(event) => {
            event.preventDefault();
          }}
        >
          复制
        </ContextMenuItem>
      ),
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(slot("context-menu-content")).toBeInTheDocument();
  });

  it("closeOnClick=false 时保持菜单打开", async () => {
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => <ContextMenuItem closeOnClick={false}>复制</ContextMenuItem>,
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(slot("context-menu-content")).toBeInTheDocument();
  });

  it("disabled 时点击既不回调也不关闭", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => (
        <ContextMenuItem disabled onClick={onClick}>
          复制
        </ContextMenuItem>
      ),
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onClick).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(slot("context-menu-content")).toBeInTheDocument();
  });
});

describe("ContextMenuItem - 高亮", () => {
  it("打开后第一项被高亮（aria-activedescendant 联动）", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuItem>复制</ContextMenuItem>
        <ContextMenuItem>粘贴</ContextMenuItem>
      </>
    ));
    await waitForMount();

    const items = slots("context-menu-item");
    expect(items[0]).toHaveAttribute("data-highlighted", "");
    expect(slot("context-menu-content")).toHaveAttribute(
      "aria-activedescendant",
      items[0]!.id,
    );
  });

  it("指针移入另一项时高亮转移（进入/退出两个方向）", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuItem>复制</ContextMenuItem>
        <ContextMenuItem>粘贴</ContextMenuItem>
      </>
    ));
    await waitForMount();

    const items = slots("context-menu-item");
    fireEvent.pointerEnter(items[1]!);

    expect(items[0]).not.toHaveAttribute("data-highlighted");
    expect(items[1]).toHaveAttribute("data-highlighted", "");
    expect(slot("context-menu-content")).toHaveAttribute(
      "aria-activedescendant",
      items[1]!.id,
    );
  });

  it("highlightItemOnHover=false 时悬停不改变高亮", async () => {
    renderOpenMenu(
      () => (
        <>
          <ContextMenuItem>复制</ContextMenuItem>
          <ContextMenuItem>粘贴</ContextMenuItem>
        </>
      ),
      { highlightItemOnHover: false },
    );
    await waitForMount();

    const items = slots("context-menu-item");
    fireEvent.pointerEnter(items[1]!);

    expect(items[0]).toHaveAttribute("data-highlighted", "");
    expect(items[1]).not.toHaveAttribute("data-highlighted");
  });
});

describe("ContextMenuItem - 字符导航与指针移动", () => {
  it("字符导航按 label 匹配并移动高亮", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuItem>复制</ContextMenuItem>
        <ContextMenuItem>粘贴</ContextMenuItem>
      </>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("context-menu-content")!, { key: "粘" });

    expect(slots("context-menu-item")[1]).toHaveAttribute(
      "data-highlighted",
      "",
    );
  });

  it("显式 label 优先用于字符导航", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuItem label="copy">复制</ContextMenuItem>
        <ContextMenuItem label="paste">粘贴</ContextMenuItem>
      </>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("context-menu-content")!, { key: "p" });

    expect(slots("context-menu-item")[1]).toHaveAttribute(
      "data-highlighted",
      "",
    );
  });

  it("在项内移动指针也会高亮", async () => {
    renderOpenMenu(() => (
      <>
        <ContextMenuItem>复制</ContextMenuItem>
        <ContextMenuItem>粘贴</ContextMenuItem>
      </>
    ));
    await waitForMount();

    fireEvent.pointerMove(slots("context-menu-item")[1]!);

    expect(slots("context-menu-item")[1]).toHaveAttribute(
      "data-highlighted",
      "",
    );
  });
});
