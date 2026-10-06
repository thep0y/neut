import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { AlertDialog } from "~/components/alert-dialog/AlertDialog/AlertDialog";
import { AlertDialogContent } from "~/components/alert-dialog/AlertDialogContent/AlertDialogContent";
import { AlertDialogTrigger } from "~/components/alert-dialog/AlertDialogTrigger/AlertDialogTrigger";

/**
 * AlertDialog 根组件：它把 Dialog 的状态机原样复用（受控/非受控、动画挂载、
 * 滚动锁定），只把根节点的 data-slot 换成 alert 的。这里验证这层委托契约。
 */
function content(): HTMLElement | null {
  return document.querySelector('[data-slot="alert-dialog-content"]');
}

describe("AlertDialog", () => {
  it("根节点渲染 data-slot=alert-dialog（覆盖 Dialog 的默认 data-slot）", () => {
    render(() => <AlertDialog>内容</AlertDialog>);

    const root = document.querySelector('[data-slot="alert-dialog"]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveTextContent("内容");
    expect(document.querySelector('[data-slot="dialog"]')).toBeNull();
  });

  it("透传 class/classList 与其他属性到根节点", () => {
    render(() => (
      <AlertDialog
        class="my-alert"
        classList={{ "is-locked": true }}
        data-testid="alert-root"
      >
        内容
      </AlertDialog>
    ));

    const root = document.querySelector(
      '[data-slot="alert-dialog"]',
    ) as HTMLElement;
    expect(root).toHaveClass("my-alert");
    expect(root).toHaveClass("is-locked");
    expect(root).toHaveAttribute("data-testid", "alert-root");
  });

  it("默认关闭：不挂载内容，trigger 状态为 closed", () => {
    render(() => (
      <AlertDialog>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>正文</AlertDialogContent>
      </AlertDialog>
    ));

    expect(content()).toBeNull();
    expect(
      document.querySelector('[data-slot="alert-dialog-trigger"]'),
    ).toHaveAttribute("data-state", "closed");
  });

  it("defaultOpen 时初始打开", () => {
    render(() => (
      <AlertDialog defaultOpen>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>正文</AlertDialogContent>
      </AlertDialog>
    ));

    expect(content()).toBeInTheDocument();
  });

  it("点击 trigger 打开并回调 onOpenChange(true)", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <AlertDialog onOpenChange={onOpenChange}>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>正文</AlertDialogContent>
      </AlertDialog>
    ));

    fireEvent.click(
      document.querySelector(
        '[data-slot="alert-dialog-trigger"]',
      ) as HTMLElement,
    );

    expect(content()).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
