import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { ContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/ContextMenuTrigger";

function triggerEl(): HTMLElement {
  return document.querySelector(
    '[data-slot="context-menu-trigger"]',
  ) as HTMLElement;
}

describe("ContextMenuTrigger - 渲染与多态", () => {
  it("默认渲染 div，带 data-slot 与可聚焦的 tabIndex", () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger>右键区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    const trigger = triggerEl();
    expect(trigger.tagName).toBe("DIV");
    expect(trigger).toHaveAttribute("data-slot", "context-menu-trigger");
    expect(trigger).toHaveAttribute("tabindex", "0");
    expect(trigger).toHaveTextContent("右键区域");
  });

  it("tabIndex 与 class 可以被调用方覆盖/合并", () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger tabIndex={-1} class="my-trigger">
          区域
        </ContextMenuTrigger>
      </ContextMenu>
    ));

    const trigger = triggerEl();
    expect(trigger).toHaveAttribute("tabindex", "-1");
    expect(trigger.className).toContain("select-none");
    expect(trigger.className).toContain("my-trigger");
  });

  it("component 多态渲染成指定标签", () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger component="button">按钮</ContextMenuTrigger>
      </ContextMenu>
    ));

    expect(triggerEl().tagName).toBe("BUTTON");
  });

  it("ref 透传真实 DOM 元素", () => {
    let captured: HTMLElement | undefined;
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger
          ref={(el) => {
            captured = el as HTMLElement;
          }}
        >
          区域
        </ContextMenuTrigger>
      </ContextMenu>
    ));

    expect(captured).toBe(triggerEl());
  });

  it("用户自己的 onClick / onContextMenu 不被内部监听覆盖", () => {
    const onClick = vi.fn();
    const onContextMenu = vi.fn();
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger onClick={onClick} onContextMenu={onContextMenu}>
          区域
        </ContextMenuTrigger>
      </ContextMenu>
    ));

    fireEvent.click(triggerEl());
    fireEvent.contextMenu(triggerEl());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
  });
});

describe("ContextMenuTrigger - 打开状态属性", () => {
  it("关闭时没有 data-popup-open / data-pressed", () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    expect(triggerEl()).not.toHaveAttribute("data-popup-open");
    expect(triggerEl()).not.toHaveAttribute("data-pressed");
  });

  it("打开后出现 data-popup-open 与 data-pressed", () => {
    render(() => (
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    expect(triggerEl()).toHaveAttribute("data-popup-open", "");
    expect(triggerEl()).toHaveAttribute("data-pressed", "");
  });
});

describe("ContextMenuTrigger - 唤起交互", () => {
  it("右键以鼠标坐标打开，事件详情带 trigger 与原始事件", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 12,
      clientY: 34,
    });
    triggerEl().dispatchEvent(event);

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-press" }),
    );
    const details = onOpenChange.mock.calls[0]![1] as {
      trigger: Element;
      event: Event;
    };
    expect(details.trigger).toBe(triggerEl());
    expect(details.event).toBe(event);
  });

  it("右键打开后不渲染 content 中的锚点也可用（锚点是虚拟元素）", () => {
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    fireEvent.contextMenu(triggerEl(), { clientX: 5, clientY: 6 });

    expect(triggerEl()).toHaveAttribute("data-popup-open", "");
  });

  it("disabled 时右键不打开", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <ContextMenu disabled onOpenChange={onOpenChange}>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    fireEvent.contextMenu(triggerEl());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(triggerEl()).not.toHaveAttribute("data-popup-open");
  });

  it("菜单键以触发器中心为锚点打开", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));
    triggerEl().getBoundingClientRect = () =>
      ({ left: 100, top: 50, width: 40, height: 20 }) as DOMRect;

    fireEvent.keyDown(triggerEl(), { key: "F10", shiftKey: true });

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-press" }),
    );
  });

  it("受控打开时 UI 跟随外部 open", () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <ContextMenu open={open()}>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
      </ContextMenu>
    ));

    expect(triggerEl()).not.toHaveAttribute("data-popup-open");

    setOpen(true);

    expect(triggerEl()).toHaveAttribute("data-popup-open", "");
  });
});
