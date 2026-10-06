import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "~/components/sheet/Sheet/Sheet";
import type { SheetProps } from "~/components/sheet/sheet.types";
import { SheetClose } from "~/components/sheet/SheetClose/SheetClose";
import { SheetContent } from "~/components/sheet/SheetContent/SheetContent";
import { SheetDescription } from "~/components/sheet/SheetDescription/SheetDescription";
import { SheetFooter } from "~/components/sheet/SheetFooter/SheetFooter";
import { SheetHeader } from "~/components/sheet/SheetHeader/SheetHeader";
import { SheetTitle } from "~/components/sheet/SheetTitle/SheetTitle";
import { SheetTrigger } from "~/components/sheet/SheetTrigger/SheetTrigger";

/**
 * Sheet 整机集成：真实组件树（Trigger + Content + Overlay + 各结构部件）。
 *
 * SheetContent 复用 DialogSurface：遮罩是 DialogOverlay（data-slot=dialog-overlay）、
 * Portal 是 DialogPortal，关闭后同样保留挂载直到退场动画（jsdom 不触发 animationend）。
 */
function Composed(props: { sheet?: SheetProps; side?: "left" | "right" } = {}) {
  return (
    <Sheet {...props.sheet}>
      <SheetTrigger>打开面板</SheetTrigger>
      <SheetContent side={props.side}>
        <SheetHeader>
          <SheetTitle>面板标题</SheetTitle>
          <SheetDescription>面板说明</SheetDescription>
        </SheetHeader>
        <p>正文</p>
        <SheetFooter>
          <SheetClose>关闭</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function trigger(): HTMLElement {
  return document.querySelector('[data-slot="sheet-trigger"]') as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="sheet-content"]');
}

function surface(): HTMLElement {
  return content() as HTMLElement;
}

function overlay(): HTMLElement | null {
  return document.querySelector('[data-slot="dialog-overlay"]');
}

describe("sheet 集成 - 打开与关闭流程", () => {
  it("初始关闭：不渲染面板与遮罩，trigger 状态为 closed", () => {
    render(() => <Composed />);

    expect(content()).toBeNull();
    expect(overlay()).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("点击 trigger 打开：渲染 dialog 与遮罩，并回调 onOpenChange(true)", async () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ onOpenChange }} />);
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).not.toBeNull();
    expect(overlay()).not.toBeNull();
    expect(surface()).toHaveAttribute("role", "dialog");
    expect(surface()).toHaveAttribute("data-slot", "sheet-content");
    expect(surface()).toHaveAttribute("data-open", "true");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("打开后结构子部件都渲染，且 aria 交叉引用成对", async () => {
    render(() => <Composed />);
    const user = userEvent.setup();

    await user.click(trigger());

    for (const slot of [
      "sheet-header",
      "sheet-title",
      "sheet-description",
      "sheet-footer",
      "sheet-close",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }

    const title = document.querySelector('[data-slot="sheet-title"]')!;
    const description = document.querySelector(
      '[data-slot="sheet-description"]',
    )!;
    expect(surface().getAttribute("aria-labelledby")).toBe(title.id);
    expect(surface().getAttribute("aria-describedby")).toBe(description.id);
  });

  it("side 变体写进 data-side", async () => {
    render(() => <Composed side="left" />);
    const user = userEvent.setup();

    await user.click(trigger());

    expect(surface()).toHaveAttribute("data-side", "left");
  });

  it("点击遮罩关闭，关闭后保留挂载直到退场动画结束", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ defaultOpen: true, onOpenChange }} />);
    const mounted = content();

    fireEvent.click(overlay() as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger()).toHaveAttribute("data-state", "closed");
    expect(surface()).toHaveAttribute("data-open", "false");
    expect(content()).toBe(mounted);
  });

  it("遮罩上的 pointerdown + click 真实序列只触发一次关闭回调", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.pointerDown(overlay() as HTMLElement);
    fireEvent.click(overlay() as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("派发 animationend 后内容与遮罩被卸载", () => {
    render(() => <Composed sheet={{ defaultOpen: true }} />);
    const mounted = content()!;

    fireEvent.click(overlay() as HTMLElement);
    fireEvent.animationEnd(mounted);

    expect(content()).toBeNull();
    expect(overlay()).toBeNull();
  });

  it("打开状态下 animationend 不会卸载", () => {
    render(() => <Composed sheet={{ defaultOpen: true }} />);

    fireEvent.animationEnd(surface());

    expect(content()).not.toBeNull();
  });

  it("点击 SheetClose 关闭面板", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.click(
      document.querySelector('[data-slot="sheet-close"]') as HTMLElement,
    );

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("showCloseButton=false 时不渲染关闭按钮", () => {
    render(() => (
      <Sheet defaultOpen>
        <SheetContent showCloseButton={false}>正文</SheetContent>
      </Sheet>
    ));

    expect(document.querySelector('[data-slot="sheet-close"]')).toBeNull();
  });

  it("浮层标记 aria-modal=true 且可编程聚焦（继承 DialogSurface 的修复）", () => {
    render(() => <Composed sheet={{ defaultOpen: true }} />);

    expect(surface()).toHaveAttribute("aria-modal", "true");
    expect(surface()).toHaveAttribute("tabindex", "-1");
  });

  it("按 Escape 关闭面板（回归：Dialog 此前没有 Escape 处理）", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("浮层内已经 preventDefault 的 Escape 不再重复关闭", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ defaultOpen: true, onOpenChange }} />);
    const panel = surface();
    panel.addEventListener("keydown", (event) => event.preventDefault());

    fireEvent.keyDown(panel, { key: "Escape", cancelable: true });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("sheet 集成 - 受控与非受控", () => {
  it("非受控：defaultOpen 初始化 + 交互写内部状态", () => {
    render(() => <Composed sheet={{ defaultOpen: true }} />);
    expect(content()).not.toBeNull();

    fireEvent.click(overlay() as HTMLElement);
    expect(surface()).toHaveAttribute("data-open", "false");
  });

  it("受控 open=false：点击 trigger 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ open: false, onOpenChange }} />);
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(content()).toBeNull();
  });

  it("受控 open=true：点击遮罩只回调，面板不消失", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed sheet={{ open: true, onOpenChange }} />);

    fireEvent.click(overlay() as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(content()).not.toBeNull();
    expect(surface()).toHaveAttribute("data-open", "true");
  });

  it("外部回写受控值后 UI 跟随", async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Sheet open={open()} onOpenChange={setOpen}>
        <SheetTrigger>打开面板</SheetTrigger>
        <SheetContent>正文</SheetContent>
      </Sheet>
    ));

    expect(content()).toBeNull();

    setOpen(true);
    await Promise.resolve();

    expect(content()).not.toBeNull();
  });
});

describe("sheet 集成 - 根节点与滚动锁定", () => {
  it("根节点是 data-slot=sheet 的容器", () => {
    render(() => <Composed />);

    expect(document.querySelector('[data-slot="sheet"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dialog"]')).toBeNull();
  });

  it("lockScroll=false 时不锁文档滚动，默认锁住", () => {
    const { unmount } = render(() => (
      <Composed sheet={{ defaultOpen: true, lockScroll: false }} />
    ));
    expect(document.body.style.overflowY).toBe("");

    unmount();
    render(() => <Composed sheet={{ defaultOpen: true }} />);
    expect(document.body.style.overflowY).toBe("hidden");
  });
});
