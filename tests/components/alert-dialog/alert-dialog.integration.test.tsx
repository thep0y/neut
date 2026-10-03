import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { AlertDialog } from "~/components/alert-dialog/AlertDialog/AlertDialog";
import { AlertDialogAction } from "~/components/alert-dialog/AlertDialogAction/AlertDialogAction";
import { AlertDialogCancel } from "~/components/alert-dialog/AlertDialogCancel/AlertDialogCancel";
import { AlertDialogContent } from "~/components/alert-dialog/AlertDialogContent/AlertDialogContent";
import { AlertDialogDescription } from "~/components/alert-dialog/AlertDialogDescription/AlertDialogDescription";
import { AlertDialogFooter } from "~/components/alert-dialog/AlertDialogFooter/AlertDialogFooter";
import { AlertDialogHeader } from "~/components/alert-dialog/AlertDialogHeader/AlertDialogHeader";
import { AlertDialogMedia } from "~/components/alert-dialog/AlertDialogMedia/AlertDialogMedia";
import { AlertDialogTitle } from "~/components/alert-dialog/AlertDialogTitle/AlertDialogTitle";
import { AlertDialogTrigger } from "~/components/alert-dialog/AlertDialogTrigger/AlertDialogTrigger";
import type { AlertDialogProps } from "~/components/alert-dialog/AlertDialog/AlertDialog.types";

/**
 * AlertDialog 整机集成：真实组件树（Trigger + Content + Overlay + 各结构部件）。
 *
 * 与 Dialog 的差异正是本文件的重点：
 * - content 的 role 是 `alertdialog`；
 * - 「必须显式选择」：点击遮罩与 Esc 都不关闭，只能点 Action / Cancel；
 * - 关闭后同样保留挂载，直到退场动画结束（jsdom 不触发 animationend，需手动派发）。
 */
function Composed(props: { dialog?: AlertDialogProps } = {}) {
  return (
    <AlertDialog {...props.dialog}>
      <AlertDialogTrigger>删除</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogMedia>!</AlertDialogMedia>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>该操作不可撤销</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction>确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function trigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-trigger"]',
  ) as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="alert-dialog-content"]');
}

function overlay(): HTMLElement | null {
  return document.querySelector('[data-slot="dialog-overlay"]');
}

function surface(): HTMLElement {
  return content() as HTMLElement;
}

describe("alert-dialog 集成 - 打开与关闭流程", () => {
  it("初始关闭：不渲染内容与遮罩，trigger 状态为 closed", () => {
    render(() => <Composed />);

    expect(content()).toBeNull();
    expect(overlay()).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("点击 trigger 打开：渲染 alertdialog 与遮罩，并回调 onOpenChange(true)", async () => {
    const onOpenChange = vi.fn();
    render(() => <Composed dialog={{ onOpenChange }} />);
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).not.toBeNull();
    expect(overlay()).not.toBeNull();
    expect(surface()).toHaveAttribute("role", "alertdialog");
    expect(surface()).toHaveAttribute("data-open", "true");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("data-state", "open");
    // 关闭状态变化只回调一次，且不带事件详情对象（当前 API：单参数 boolean）
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("打开后结构子部件都渲染，且 aria 交叉引用成对", async () => {
    render(() => <Composed />);
    const user = userEvent.setup();

    await user.click(trigger());

    for (const slot of [
      "alert-dialog-media",
      "alert-dialog-header",
      "alert-dialog-title",
      "alert-dialog-description",
      "alert-dialog-footer",
      "alert-dialog-cancel",
      "alert-dialog-action",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }

    const title = document.querySelector('[data-slot="alert-dialog-title"]')!;
    const description = document.querySelector(
      '[data-slot="alert-dialog-description"]',
    )!;
    expect(surface().getAttribute("aria-labelledby")).toBe(title.id);
    expect(surface().getAttribute("aria-describedby")).toBe(description.id);
  });

  it("点击 Action 关闭，关闭后保留挂载直到退场动画结束", () => {
    const onOpenChange = vi.fn();
    const onClick = vi.fn();
    render(() => (
      <AlertDialog defaultOpen onOpenChange={onOpenChange}>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogAction onClick={onClick}>确认</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    ));
    const mounted = content();

    fireEvent.click(
      document.querySelector(
        '[data-slot="alert-dialog-action"]',
      ) as HTMLElement,
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger()).toHaveAttribute("data-state", "closed");
    expect(surface()).toHaveAttribute("data-open", "false");
    // 仍在挂载中，等待退场动画
    expect(content()).toBe(mounted);
  });

  it("派发 animationend 后内容与遮罩被卸载", () => {
    render(() => <Composed dialog={{ defaultOpen: true }} />);
    const mounted = content()!;

    fireEvent.click(
      document.querySelector(
        '[data-slot="alert-dialog-action"]',
      ) as HTMLElement,
    );
    fireEvent.animationEnd(mounted);

    expect(content()).toBeNull();
    expect(overlay()).toBeNull();
  });

  it("打开状态下 animationend 不会卸载", () => {
    render(() => <Composed dialog={{ defaultOpen: true }} />);

    fireEvent.animationEnd(surface());

    expect(content()).not.toBeNull();
  });

  it("点击 Cancel 关闭", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed dialog={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.click(
      document.querySelector(
        '[data-slot="alert-dialog-cancel"]',
      ) as HTMLElement,
    );

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("AlertDialog 不渲染任何内置关闭按钮（必须显式选择）", () => {
    render(() => <Composed dialog={{ defaultOpen: true }} />);

    expect(
      document.querySelector('[data-slot="alert-dialog-close"]'),
    ).toBeNull();
    expect(document.querySelector('[data-slot="dialog-close"]')).toBeNull();
  });
});

describe("alert-dialog 集成 - 必须显式选择", () => {
  it("点击遮罩（含 pointerdown + click 的真实序列）不关闭，也不回调", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed dialog={{ defaultOpen: true, onOpenChange }} />);

    const mask = overlay() as HTMLElement;
    fireEvent.pointerDown(mask);
    fireEvent.click(mask);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(content()).not.toBeNull();
    expect(surface()).toHaveAttribute("data-open", "true");
  });

  it("按 Escape 不关闭", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed dialog={{ defaultOpen: true, onOpenChange }} />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(surface(), { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(content()).not.toBeNull();
  });

  it("自定义 overlayClass 生效，遮罩仍不触发关闭", () => {
    const onOpenChange = vi.fn();
    // overlayClass 在 AlertDialogContent 的公开类型里缺失（见报告），
    // 但运行时会原样转给 DialogSurface，这里用断言保留这条可测契约。
    const withOverlayClass = {
      overlayClass: "my-overlay",
      children: "正文",
    } as unknown as Parameters<typeof AlertDialogContent>[0];
    render(() => (
      <AlertDialog defaultOpen onOpenChange={onOpenChange}>
        <AlertDialogContent {...withOverlayClass} />
      </AlertDialog>
    ));

    const mask = overlay() as HTMLElement;
    expect(mask).toHaveClass("my-overlay");
    fireEvent.click(mask);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("alert-dialog 集成 - 受控与非受控", () => {
  it("非受控：defaultOpen 初始化 + 交互写内部状态", () => {
    render(() => <Composed dialog={{ defaultOpen: true }} />);
    expect(content()).not.toBeNull();

    fireEvent.click(
      document.querySelector(
        '[data-slot="alert-dialog-action"]',
      ) as HTMLElement,
    );
    expect(surface()).toHaveAttribute("data-open", "false");
  });

  it("受控 open=false：点击 trigger 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    render(() => <Composed dialog={{ open: false, onOpenChange }} />);
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(content()).toBeNull();
  });

  it("受控 open=true：点击 Action 只回调，内容不消失", () => {
    const onOpenChange = vi.fn();
    render(() => <Composed dialog={{ open: true, onOpenChange }} />);

    fireEvent.click(
      document.querySelector(
        '[data-slot="alert-dialog-action"]',
      ) as HTMLElement,
    );

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(content()).not.toBeNull();
    expect(surface()).toHaveAttribute("data-open", "true");
  });

  it("外部回写受控值后 UI 跟随", async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>正文</AlertDialogContent>
      </AlertDialog>
    ));

    expect(content()).toBeNull();

    setOpen(true);
    await Promise.resolve();

    expect(content()).not.toBeNull();
  });
});

describe("alert-dialog 集成 - 根节点", () => {
  it("根节点是 data-slot=alert-dialog 的容器", () => {
    render(() => <Composed />);

    expect(
      document.querySelector('[data-slot="alert-dialog"]'),
    ).toBeInTheDocument();
    // 不再出现 Dialog 的 data-slot
    expect(document.querySelector('[data-slot="dialog"]')).toBeNull();
  });

  it("未提供标题时 aria-labelledby / aria-describedby 为空", () => {
    render(() => (
      <AlertDialog defaultOpen>
        <AlertDialogContent>正文</AlertDialogContent>
      </AlertDialog>
    ));

    expect(surface()).not.toHaveAttribute("aria-labelledby");
    expect(surface()).not.toHaveAttribute("aria-describedby");
  });

  it("lockScroll=false 时不锁文档滚动，默认锁住", () => {
    const { unmount } = render(() => (
      <Composed dialog={{ defaultOpen: true, lockScroll: false }} />
    ));
    expect(document.body.style.overflowY).toBe("");

    unmount();
    render(() => <Composed dialog={{ defaultOpen: true }} />);
    expect(document.body.style.overflowY).toBe("hidden");
  });
});
