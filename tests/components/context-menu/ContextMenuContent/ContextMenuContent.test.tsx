import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { ContextMenuContent } from "~/components/context-menu/ContextMenuContent/ContextMenuContent";
import { ContextMenuItem } from "~/components/context-menu/ContextMenuItem/ContextMenuItem";
import { ContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/ContextMenuTrigger";

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="context-menu-content"]');
}

function positioner(): HTMLElement | null {
  return document.querySelector('[data-slot="context-menu-positioner"]');
}

function items(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
  );
}

function trigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="context-menu-trigger"]',
  ) as HTMLElement;
}

function renderMenu(contentProps: Record<string, unknown> = {}) {
  return render(() => (
    <ContextMenu defaultOpen>
      <ContextMenuTrigger>区域</ContextMenuTrigger>
      <ContextMenuContent {...contentProps}>
        <ContextMenuItem>复制</ContextMenuItem>
        <ContextMenuItem>粘贴</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ));
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ContextMenuContent - 挂载与结构", () => {
  it("关闭时不渲染浮层", () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>内容</ContextMenuContent>
      </ContextMenu>
    ));

    expect(content()).toBeNull();
    expect(positioner()).toBeNull();
  });

  it("打开时经 Portal 挂到 body，role=menu 且可聚焦", () => {
    renderMenu();

    const popup = content()!;
    expect(popup).toBeInTheDocument();
    expect(document.body.contains(popup)).toBe(true);
    // Portal 把浮层渲染到组件树之外（不在触发器所在的容器里）
    expect(trigger().parentElement!.contains(popup)).toBe(false);
    expect(popup).toHaveAttribute("role", "menu");
    expect(popup).toHaveAttribute("tabindex", "-1");
    expect(popup).toHaveAttribute("data-slot", "context-menu-content");
    expect(popup.id).toMatch(/^context-menu-content-/);
  });

  it("外层 positioner 带 data-slot 与 data-side/data-align", () => {
    renderMenu({ side: "bottom", align: "center" });

    const outer = positioner()!;
    expect(outer).toHaveAttribute("data-slot", "context-menu-positioner");
    expect(outer).toHaveAttribute("data-side", "bottom");
    expect(outer).toHaveAttribute("data-align", "center");
    expect(content()).toHaveAttribute("data-side", "bottom");
    expect(content()).toHaveAttribute("data-align", "center");
  });

  it("默认 side=right / align=start", () => {
    renderMenu();

    expect(content()).toHaveAttribute("data-side", "right");
    expect(content()).toHaveAttribute("data-align", "start");
  });

  it("逻辑方向在未被翻转时回写逻辑值", () => {
    renderMenu({ side: "inline-end", align: "start", dir: "ltr" });

    expect(content()).toHaveAttribute("data-side", "inline-end");
  });

  it("渲染子菜单项内容", () => {
    renderMenu();

    expect(items()).toHaveLength(2);
    expect(items()[0]).toHaveTextContent("复制");
  });

  it("class / style / 其余属性透传到 popup 元素", () => {
    renderMenu({ class: "my-content", style: { color: "red" }, "data-x": "1" });

    const popup = content()!;
    expect(popup.className).toContain("my-content");
    expect(popup.style.color).toBe("red");
    expect(popup).toHaveAttribute("data-x", "1");
  });
});

describe("ContextMenuContent - 高亮与键盘", () => {
  it("挂载完成后把高亮落到第一项", async () => {
    renderMenu();
    await Promise.resolve();
    await Promise.resolve();

    expect(content()).toHaveAttribute("aria-activedescendant", items()[0]!.id);
  });

  it("方向键移动高亮，并同步 data-highlighted", async () => {
    renderMenu();
    await Promise.resolve();
    await Promise.resolve();

    fireEvent.keyDown(content()!, { key: "ArrowDown" });

    expect(content()).toHaveAttribute("aria-activedescendant", items()[1]!.id);
    expect(items()[0]).not.toHaveAttribute("data-highlighted");
    expect(items()[1]).toHaveAttribute("data-highlighted", "");
  });

  it("用户的 onKeyDown 先于内部处理被调用", async () => {
    const onKeyDown = vi.fn();
    renderMenu({ onKeyDown });
    await Promise.resolve();

    fireEvent.keyDown(content()!, { key: "ArrowDown" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("焦点落在 popup 上（键盘事件依赖它）", async () => {
    renderMenu();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.activeElement).toBe(content());
  });
});

describe("ContextMenuContent - 定位与动画", () => {
  it("没有锚点时 opacity 为 0，右键打开后完成定位", async () => {
    renderMenu();
    await Promise.resolve();

    expect(positioner()!.style.opacity).toBe("0");
  });

  it("右键打开后 positioner 完成定位并给出可用高度", async () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>复制</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    fireEvent.contextMenu(trigger(), { clientX: 100, clientY: 100 });
    await Promise.resolve();
    await Promise.resolve();

    const outer = positioner()!;
    expect(outer.style.opacity).toBe("1");
    expect(content()!.style.getPropertyValue("--available-height")).not.toBe(
      "",
    );
  });

  it("打开后延迟一帧才置 data-open，避免首帧跳位", async () => {
    vi.useFakeTimers();
    renderMenu();
    await vi.advanceTimersByTimeAsync(0);

    expect(content()).not.toHaveAttribute("data-open");

    await vi.advanceTimersByTimeAsync(16);

    expect(content()).toHaveAttribute("data-open", "");
  });

  it("关闭时移除 data-open 并卸载浮层", async () => {
    vi.useFakeTimers();
    render(() => (
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>复制</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));
    await vi.advanceTimersByTimeAsync(16);
    expect(content()).toHaveAttribute("data-open", "");

    const onKeyDown = vi.fn();
    void onKeyDown;
    fireEvent.keyDown(document, { key: "Escape" });

    expect(content()).toBeNull();
  });
});
