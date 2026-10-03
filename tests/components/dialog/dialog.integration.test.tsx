import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDialogContext } from "~/components/dialog/Dialog/Dialog.context";
import { Dialog } from "~/components/dialog/Dialog/Dialog";
import { useDialogContentContext } from "~/components/dialog/DialogContent/DialogContent.context";
import { DialogClose } from "~/components/dialog/DialogClose/DialogClose";
import { DialogContent } from "~/components/dialog/DialogContent/DialogContent";
import { DialogDescription } from "~/components/dialog/DialogDescription/DialogDescription";
import { DialogFooter } from "~/components/dialog/DialogFooter/DialogFooter";
import { DialogHeader } from "~/components/dialog/DialogHeader/DialogHeader";
import { DialogTitle } from "~/components/dialog/DialogTitle/DialogTitle";
import { DialogTrigger } from "~/components/dialog/DialogTrigger/DialogTrigger";

/**
 * Dialog 集成测试。
 *
 * 与 Popover 的差异（也是本文件的重点）：
 * - Dialog 的关闭**保留挂载**直到退场动画结束（`onAnimationEnd` 卸载），
 *   因此 `show`（是否挂载）与 `open`（动画状态）是两个信号；
 * - `data-state` 由 open 驱动，`data-slot` 用于样式与选择器。
 *
 * jsdom 不触发真实的 CSS animationend，因此"动画结束后卸载"这一步
 * 需要手动派发 `animationend`。
 */

function renderDialog(
  props: {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    lockScroll?: boolean;
    dismissOnEscape?: boolean;
    contentProps?: Record<string, unknown>;
  } = {},
) {
  return render(() => (
    <Dialog
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      lockScroll={props.lockScroll}
      dismissOnEscape={props.dismissOnEscape}
    >
      <DialogTrigger>打开</DialogTrigger>
      <DialogContent {...props.contentProps}>
        <DialogHeader>
          <DialogTitle>标题</DialogTitle>
          <DialogDescription>描述</DialogDescription>
        </DialogHeader>
        <p>正文</p>
        <DialogFooter>底部</DialogFooter>
      </DialogContent>
    </Dialog>
  ));
}

function trigger(): HTMLElement {
  return document.querySelector('[data-slot="dialog-trigger"]') as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="dialog-content"]');
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Dialog - 基础状态", () => {
  it("默认关闭：不渲染 content", () => {
    renderDialog();

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("defaultOpen 时初始打开", () => {
    renderDialog({ defaultOpen: true });

    expect(content()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("点击 trigger 打开", async () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("trigger 已打开时点击不再切换（Dialog 只负责打开）", async () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    // 与 Popover 不同：DialogTrigger 只打开，不做 toggle
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(content()).toBeInTheDocument();
  });

  it("关闭后保留挂载，直到动画结束才卸载", () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, onOpenChange });
    const surface = content()!;

    // 关闭方式：Escape / DialogClose / 点击 overlay
    fireEvent.click(document.querySelector('[data-slot="dialog-overlay"]')!);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger()).toHaveAttribute("data-state", "closed");
    // 仍在挂载中，等待退场动画
    expect(content()).toBe(surface);
  });

  it("派发 animationend 后节点被卸载", () => {
    renderDialog({ defaultOpen: true });
    const surface = content()!;

    // 先关闭让 open=false，此时 animationend 才会触发卸载
    fireEvent.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    fireEvent.animationEnd(surface);

    expect(content()).toBeNull();
  });

  it("打开状态下 animationend 不会卸载节点", () => {
    renderDialog({ defaultOpen: true });

    fireEvent.animationEnd(content()!);

    expect(content()).toBeInTheDocument();
  });

  it("trigger 带 data-slot 与 aria-haspopup", () => {
    renderDialog();

    expect(trigger()).toHaveAttribute("data-slot", "dialog-trigger");
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("content 是 role=dialog", () => {
    renderDialog({ defaultOpen: true });

    expect(content()).toHaveAttribute("role", "dialog");
  });
});

describe("Dialog - 关闭途径", () => {
  it("点击 DialogClose 关闭", async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogClose>取消</DialogClose>
        </DialogContent>
      </Dialog>
    ));
    const user = userEvent.setup();

    await user.click(document.querySelector('[data-slot="dialog-close"]')!);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("默认展示内置关闭按钮", () => {
    renderDialog({ defaultOpen: true });

    expect(
      document.querySelector('[data-slot="dialog-close"]'),
    ).toBeInTheDocument();
  });

  it("showCloseButton=false 时不渲染关闭按钮", () => {
    render(() => (
      <Dialog defaultOpen>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent showCloseButton={false}>正文</DialogContent>
      </Dialog>
    ));

    expect(document.querySelector('[data-slot="dialog-close"]')).toBeNull();
  });

  it("点击 overlay 关闭（dismissOnOverlayClick 默认 true）", () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, onOpenChange });

    fireEvent.click(document.querySelector('[data-slot="dialog-overlay"]')!);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("dismissOnOverlayClick=false 时点击 overlay 不关闭", () => {
    const onOpenChange = vi.fn();
    renderDialog({
      defaultOpen: true,
      onOpenChange,
      contentProps: { dismissOnOverlayClick: false },
    });

    fireEvent.click(document.querySelector('[data-slot="dialog-overlay"]')!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("overlayClass 被应用到 overlay", () => {
    renderDialog({
      defaultOpen: true,
      contentProps: { overlayClass: "my-overlay" },
    });

    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      "my-overlay",
    );
  });
});

describe("Dialog - 受控模式", () => {
  it("受控 open=false 时点击 trigger 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderDialog({ open: false, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(content()).toBeNull();
  });

  it("受控 open=true 时点击 overlay 只回调，UI 不变", () => {
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    fireEvent.click(document.querySelector('[data-slot="dialog-overlay"]')!);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(content()).toBeInTheDocument();
  });

  it("外部回写受控值后 UI 跟随", async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent>正文</DialogContent>
      </Dialog>
    ));

    expect(content()).toBeNull();

    setOpen(true);
    await Promise.resolve();

    expect(content()).toBeInTheDocument();
  });
});

describe("Dialog - 结构子组件", () => {
  it("Header / Title / Description / Footer 都渲染", () => {
    renderDialog({ defaultOpen: true });

    expect(
      document.querySelector('[data-slot="dialog-header"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dialog-footer"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dialog-title"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dialog-description"]'),
    ).toBeInTheDocument();
  });

  it("aria-labelledby / aria-describedby 关联到 Title / Description", () => {
    renderDialog({ defaultOpen: true });

    const surface = content()!;
    const title = document.querySelector('[data-slot="dialog-title"]')!;
    const description = document.querySelector(
      '[data-slot="dialog-description"]',
    )!;

    expect(surface.getAttribute("aria-labelledby")).toBe(title.id);
    expect(surface.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("自定义 class 被合并到 content", () => {
    renderDialog({
      defaultOpen: true,
      contentProps: { class: "my-dialog" },
    });

    expect(content()).toHaveClass("my-dialog");
  });

  it("root 渲染 data-slot=dialog 的容器", () => {
    renderDialog();

    expect(document.querySelector('[data-slot="dialog"]')).toBeInTheDocument();
  });

  it("overlay 是 aria-hidden 的 presentation", () => {
    renderDialog({ defaultOpen: true });

    const overlay = document.querySelector('[data-slot="dialog-overlay"]')!;
    expect(overlay).toHaveAttribute("role", "presentation");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });
});

/**
 * 无障碍契约（回归）。
 *
 * 此前浮层既没有 `aria-modal`、也没有 `tabindex`，打开时焦点仍留在触发按钮上
 * （实测 `document.activeElement` 是 BODY），键盘/读屏用户拿不到"对话框已打开"
 * 的上下文；Escape 也完全没有处理。Drawer 早就做对了这三件事，这里与它对齐。
 */
describe("dialog 集成 - 无障碍", () => {
  it("浮层标记 aria-modal=true 且可编程聚焦", () => {
    renderDialog({ defaultOpen: true });

    expect(content()).toHaveAttribute("aria-modal", "true");
    expect(content()).toHaveAttribute("tabindex", "-1");
  });

  it("打开时把焦点移进浮层", async () => {
    renderDialog({ defaultOpen: true });
    // 聚焦走 requestAnimationFrame（等 Portal 挂载完成）
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(document.activeElement).toBe(
      document.querySelector("[data-dialog-surface]"),
    );
  });

  it("Escape 关闭对话框", () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("dismissOnEscape=false 时 Escape 不关闭", () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, dismissOnEscape: false, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("Escape 之外的按键不关闭", () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(document, { key: "a" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("dialog 集成 - 上下文错误与动画守卫", () => {
  it("useDialogContext 脱离 Dialog 时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Probe = () => {
      useDialogContext();
      return null;
    };

    expect(() => render(() => <Probe />)).toThrow(
      "useDialogContext 必须用在 <Dialog> 内部",
    );

    error.mockRestore();
  });

  it("useDialogContentContext 脱离 DialogContent 时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Probe = () => {
      useDialogContentContext();
      return null;
    };

    expect(() => render(() => <Probe />)).toThrow(
      "useDialogContentContext 必须用在 <DialogContent> 内部",
    );

    error.mockRestore();
  });

  it("仍处于打开状态时 animationend 不卸载浮层", () => {
    renderDialog({ defaultOpen: true });
    const surface = content()!;
    const overlay = document.querySelector(
      '[data-slot="dialog-overlay"]',
    ) as HTMLElement;

    // open() 为 true 时 onAnimationEnd 应直接返回，不 setShow(false)
    fireEvent.animationEnd(overlay);

    expect(content()).toBe(surface);
    expect(surface).toHaveAttribute("data-open", "true");
  });
});

describe("dialog 集成 - Trigger 守卫", () => {
  it("已打开时点击触发器不再重复回调", () => {
    const onOpenChange = vi.fn();
    renderDialog({ defaultOpen: true, onOpenChange });

    fireEvent.click(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("禁用时点击触发器不打开", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger disabled>打开</DialogTrigger>
        <DialogContent>内容</DialogContent>
      </Dialog>
    ));

    fireEvent.click(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
