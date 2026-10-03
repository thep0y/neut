import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "~/components/sheet/Sheet/Sheet";
import { SheetContent } from "~/components/sheet/SheetContent/SheetContent";
import { SheetTrigger } from "~/components/sheet/SheetTrigger/SheetTrigger";

/**
 * Sheet 根组件：复用 Dialog 的状态机（受控/非受控、动画挂载、滚动锁定），
 * 只把根节点 data-slot 换成 sheet 的。这里验证这层委托契约。
 */
function content(): HTMLElement | null {
  return document.querySelector('[data-slot="sheet-content"]');
}

describe("Sheet", () => {
  it("根节点渲染 data-slot=sheet（覆盖 Dialog 的默认 data-slot）", () => {
    render(() => <Sheet>内容</Sheet>);

    const root = document.querySelector('[data-slot="sheet"]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveTextContent("内容");
    expect(document.querySelector('[data-slot="dialog"]')).toBeNull();
  });

  it("透传 class/classList 与其他属性到根节点", () => {
    render(() => (
      <Sheet
        class="my-sheet"
        classList={{ "is-locked": true }}
        data-testid="sheet-root"
      >
        内容
      </Sheet>
    ));

    const root = document.querySelector('[data-slot="sheet"]') as HTMLElement;
    expect(root).toHaveClass("my-sheet");
    expect(root).toHaveClass("is-locked");
    expect(root).toHaveAttribute("data-testid", "sheet-root");
  });

  it("默认关闭：不挂载面板，trigger 状态为 closed", () => {
    render(() => (
      <Sheet>
        <SheetTrigger>打开</SheetTrigger>
        <SheetContent>正文</SheetContent>
      </Sheet>
    ));

    expect(content()).toBeNull();
    expect(
      document.querySelector('[data-slot="sheet-trigger"]'),
    ).toHaveAttribute("data-state", "closed");
  });

  it("defaultOpen 时初始打开", () => {
    render(() => (
      <Sheet defaultOpen>
        <SheetTrigger>打开</SheetTrigger>
        <SheetContent>正文</SheetContent>
      </Sheet>
    ));

    expect(content()).toBeInTheDocument();
  });

  it("点击 trigger 打开并回调 onOpenChange(true)", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Sheet onOpenChange={onOpenChange}>
        <SheetTrigger>打开</SheetTrigger>
        <SheetContent>正文</SheetContent>
      </Sheet>
    ));

    fireEvent.click(
      document.querySelector('[data-slot="sheet-trigger"]') as HTMLElement,
    );

    expect(content()).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
