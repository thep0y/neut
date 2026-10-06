import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "~/components/drawer/Drawer/Drawer";
import type { DrawerProps } from "~/components/drawer/Drawer/Drawer.types";
import { DrawerClose } from "~/components/drawer/DrawerClose/DrawerClose";
import { DrawerContent } from "~/components/drawer/DrawerContent/DrawerContent";
import { DrawerDescription } from "~/components/drawer/DrawerDescription/DrawerDescription";
import { DrawerFooter } from "~/components/drawer/DrawerFooter/DrawerFooter";
import { DrawerHeader } from "~/components/drawer/DrawerHeader/DrawerHeader";
import { DrawerTitle } from "~/components/drawer/DrawerTitle/DrawerTitle";
import { DrawerTrigger } from "~/components/drawer/DrawerTrigger/DrawerTrigger";
import { nextFrame } from "~tests/components/drawer/test-utils";

/**
 * Drawer 整机集成：真实组件树（Trigger + Content + Overlay + 各结构部件）。
 *
 * jsdom 不触发 CSS transition，因此「退场动画结束后卸载」需要手动派发 transitionend；
 * 入场靠 requestAnimationFrame（真实实现，等一帧即可）。
 */
function Composed(props: { content?: JSX.Element; drawer?: DrawerProps } = {}) {
  return (
    <Drawer {...props.drawer}>
      <DrawerTrigger>打开</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>抽屉标题</DrawerTitle>
          <DrawerDescription>抽屉说明</DrawerDescription>
        </DrawerHeader>
        <p>正文</p>
        {props.content}
        <DrawerFooter>
          <DrawerClose>关闭</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function trigger(): HTMLElement {
  return document.querySelector('[data-slot="drawer-trigger"]') as HTMLElement;
}

function popup(): HTMLElement | null {
  return document.querySelector('[data-slot="drawer-popup"]');
}

function overlay(): HTMLElement | null {
  return document.querySelector('[data-slot="drawer-overlay"]');
}

function popupEl(): HTMLElement {
  return popup() as HTMLElement;
}

/** 打开并等入场帧落地 */
async function openWithClick(): Promise<void> {
  fireEvent.click(trigger());
  await nextFrame();
}

describe("drawer 集成 - 打开与关闭流程", () => {
  it("初始关闭：只渲染 trigger，状态属性为 closed", () => {
    render(() => <Composed />);

    expect(popup()).toBeNull();
    expect(overlay()).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-state", "closed");
    expect(trigger()).not.toHaveAttribute("aria-controls");
  });

  it("点击 trigger 打开：渲染遮罩与 dialog，并回调 trigger-press", async () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ onOpenChange }} />);

    fireEvent.click(trigger());

    expect(popup()).not.toBeNull();
    expect(overlay()).not.toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(popupEl()).toHaveAttribute("data-state", "open");
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-press" }),
    );
  });

  it("trigger 的 aria-controls 与面板 id 成对关联", async () => {
    render(() => <Composed />);

    fireEvent.click(trigger());

    expect(trigger()).toHaveAttribute("aria-controls", popupEl().id);
  });

  it("面板是 role=dialog 且 aria-labelledby/describedby 指向标题与说明", async () => {
    render(() => <Composed />);

    fireEvent.click(trigger());

    const title = document.querySelector('[data-slot="drawer-title"]');
    const description = document.querySelector(
      '[data-slot="drawer-description"]',
    );
    expect(popupEl()).toHaveAttribute("role", "dialog");
    expect(popupEl()).toHaveAttribute("aria-modal", "true");
    expect(popupEl()).toHaveAttribute("aria-labelledby", title?.id);
    expect(popupEl()).toHaveAttribute("aria-describedby", description?.id);
    expect(popupEl()).toHaveAttribute("tabindex", "-1");
  });

  it("打开后焦点落在面板上", async () => {
    render(() => <Composed />);

    await openWithClick();

    expect(document.activeElement).toBe(popupEl());
  });

  it("DrawerClose 关闭抽屉，reason=close-press", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.click(
      document.querySelector('[data-slot="drawer-close"]') as HTMLElement,
    );

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "close-press" }),
    );
    expect(popupEl()).toHaveAttribute("data-state", "closed");
    expect(trigger()).toHaveAttribute("data-state", "closed");
    // 仍保留挂载，等待退场动画
    expect(popup()).not.toBeNull();
  });

  it("退场 transitionend 后卸载面板并把焦点还给 trigger", () => {
    render(() => <Composed drawer={{ defaultOpen: true }} />);
    const opened = popupEl();

    fireEvent.click(
      document.querySelector('[data-slot="drawer-close"]') as HTMLElement,
    );
    const focus = vi.spyOn(trigger(), "focus");
    fireEvent.transitionEnd(opened);

    expect(popup()).toBeNull();
    expect(overlay()).toBeNull();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("Esc 关闭抽屉，reason=escape-key", async () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
    expect(popupEl()).toHaveAttribute("data-state", "closed");
  });

  it("点击遮罩关闭，reason=outside-press，且一次点击只回调一次", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);

    // 真实浏览器一次点击 = pointerdown + click：两条路径曾经各关一次
    fireEvent.pointerDown(overlay()!);
    fireEvent.click(overlay()!);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" }),
    );
    expect(popupEl()).toHaveAttribute("data-state", "closed");
  });

  it("modal=false 时不渲染遮罩、不输出 aria-modal", () => {
    render(() => <Composed drawer={{ defaultOpen: true, modal: false }} />);

    expect(overlay()).toBeNull();
    expect(popupEl()).not.toHaveAttribute("aria-modal");
  });

  it("disablePointerDismissal=true 时点击外部不关闭，Esc 仍可关闭", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Composed
        drawer={{
          defaultOpen: true,
          disablePointerDismissal: true,
          onOpenChange,
        }}
      />
    ));

    fireEvent.pointerDown(document.body);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(popupEl()).toHaveAttribute("data-state", "open");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
  });
});

describe("drawer 集成 - 受控模式", () => {
  it("受控 open=false 时点击 trigger 只回调，外部回写后才打开", async () => {
    const [open, setOpen] = createSignal(false);
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ open: open(), onOpenChange }} />);

    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-press" }),
    );
    expect(popup()).toBeNull();

    setOpen(true);
    await Promise.resolve();
    await nextFrame();

    expect(popup()).not.toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("受控 open=true 时 Esc 只回调，不回写内部状态", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ open: true, onOpenChange }} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
    expect(popupEl()).toHaveAttribute("data-state", "open");
  });
});

describe("drawer 集成 - 拖拽关闭", () => {
  it("沿关闭方向拖过阈值后抬手关闭，reason=swipe", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);
    const panel = popupEl();

    fireEvent.pointerDown(panel, { button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 120 });
    expect(panel).toHaveAttribute("data-swiping", "");

    fireEvent.pointerUp(window, { clientY: 120 });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "swipe" }),
    );
    expect(panel).not.toHaveAttribute("data-swiping");
  });

  it("位移不足阈值时回弹，保持打开", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);
    const panel = popupEl();

    fireEvent.pointerDown(panel, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 40 });
    fireEvent.pointerUp(window, { clientY: 40 });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(panel).toHaveAttribute("data-state", "open");
    expect(panel).not.toHaveAttribute("data-swiping");
  });

  it("方向相反的拖拽不关闭", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);
    const panel = popupEl();

    fireEvent.pointerDown(panel, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: -200 });
    fireEvent.pointerUp(window, { clientY: -200 });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("pointercancel 取消手势：未过阈值时保持打开", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed drawer={{ defaultOpen: true, onOpenChange }} />);
    const panel = popupEl();

    fireEvent.pointerDown(panel, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 30 });
    fireEvent.pointerCancel(window, { clientY: 30 });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(panel).toHaveAttribute("data-state", "open");
  });

  it("swipeDirection=up 时向上拖过阈值即关闭", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Composed
        drawer={{ defaultOpen: true, swipeDirection: "up", onOpenChange }}
      />
    ));
    const panel = popupEl();

    fireEvent.pointerDown(panel, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: -120 });
    fireEvent.pointerUp(window, { clientY: -120 });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "swipe" }),
    );
    expect(panel).toHaveAttribute("data-swipe-direction", "up");
  });

  it("从标有 data-drawer-no-swipe 的内容起手时不进入拖拽", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Composed
        drawer={{ defaultOpen: true, onOpenChange }}
        content={<div data-drawer-no-swipe>不可拖拽</div>}
      />
    ));
    const panel = popupEl();
    const noSwipe = panel.querySelector("[data-drawer-no-swipe]")!;

    fireEvent.pointerDown(noSwipe, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 200 });
    fireEvent.pointerUp(window, { clientY: 200 });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("showSwipeHandle 渲染的把手始终可以起手拖拽", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Composed
        drawer={{ defaultOpen: true, showSwipeHandle: true, onOpenChange }}
      />
    ));
    const handle = document.querySelector(
      '[data-slot="drawer-swipe-handle"]',
    ) as HTMLElement;

    fireEvent.pointerDown(handle, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 120 });
    fireEvent.pointerUp(window, { clientY: 120 });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "swipe" }),
    );
  });
});
