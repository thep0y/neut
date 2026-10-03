import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { AlertDialog } from "~/components/alert-dialog/AlertDialog/AlertDialog";
import { AlertDialogContent } from "~/components/alert-dialog/AlertDialogContent/AlertDialogContent";
import { AlertDialogDescription } from "~/components/alert-dialog/AlertDialogDescription/AlertDialogDescription";
import { AlertDialogTitle } from "~/components/alert-dialog/AlertDialogTitle/AlertDialogTitle";
import {
  dialogContextWrapper,
  fakeDialogContext,
} from "~tests/components/alert-dialog/test-utils";

function renderIn(
  ui: () => JSX.Element,
  overrides: Parameters<typeof fakeDialogContext>[0] = {},
) {
  return render(ui, {
    wrapper: dialogContextWrapper(fakeDialogContext(overrides)),
  });
}

function surface(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-content"]',
  ) as HTMLElement;
}

/**
 * AlertDialogContent 的公开 props 里没有 overlayClass（它经由 AlertDialogContent
 * 的类型转发链丢失，见报告），但运行时会原样转给 DialogSurface。这里用交叉类型
 * 保留这层契约的可测性，不去改实现。
 */
type ContentProps = Parameters<typeof AlertDialogContent>[0] & {
  overlayClass?: string;
};

function renderContent(
  props: ContentProps,
  overrides: Parameters<typeof fakeDialogContext>[0] = {},
) {
  return renderIn(() => <AlertDialogContent {...props} />, overrides);
}

describe("AlertDialogContent - 渲染与 ARIA", () => {
  it("渲染 role=alertdialog 的浮层，带 data-slot 与默认 size", () => {
    renderIn(() => <AlertDialogContent>正文</AlertDialogContent>, {
      show: true,
      open: true,
    });

    expect(surface().tagName).toBe("DIV");
    expect(surface()).toHaveAttribute("role", "alertdialog");
    expect(surface()).toHaveAttribute("data-slot", "alert-dialog-content");
    expect(surface()).toHaveAttribute("data-size", "default");
    expect(surface()).toHaveTextContent("正文");
  });

  it("size=sm 时 data-size 跟随", () => {
    renderIn(() => <AlertDialogContent size="sm">正文</AlertDialogContent>, {
      show: true,
      open: true,
    });

    expect(surface()).toHaveAttribute("data-size", "sm");
  });

  it("data-open 跟随开关：打开 true、关闭 false", () => {
    const { unmount } = renderIn(
      () => <AlertDialogContent>正文</AlertDialogContent>,
      {
        show: true,
        open: true,
      },
    );
    expect(surface()).toHaveAttribute("data-open", "true");

    unmount();
    renderIn(() => <AlertDialogContent>正文</AlertDialogContent>, {
      show: true,
      open: false,
    });
    expect(surface()).toHaveAttribute("data-open", "false");
  });

  it("aria-labelledby / aria-describedby 指向 Title / Description", () => {
    renderIn(
      () => (
        <AlertDialogContent>
          <AlertDialogTitle>标题</AlertDialogTitle>
          <AlertDialogDescription>描述</AlertDialogDescription>
        </AlertDialogContent>
      ),
      { show: true, open: true },
    );

    const title = document.querySelector('[data-slot="alert-dialog-title"]')!;
    const description = document.querySelector(
      '[data-slot="alert-dialog-description"]',
    )!;
    expect(surface().getAttribute("aria-labelledby")).toBe(title.id);
    expect(surface().getAttribute("aria-describedby")).toBe(description.id);
  });

  it("合并外部 class 与 classList", () => {
    renderIn(
      () => (
        <AlertDialogContent class="my-content" classList={{ "is-tight": true }}>
          正文
        </AlertDialogContent>
      ),
      { show: true, open: true },
    );

    expect(surface()).toHaveClass("my-content");
    expect(surface()).toHaveClass("is-tight");
  });

  it("overlayClass 被转发到遮罩上", () => {
    renderContent(
      { overlayClass: "my-overlay", children: "正文" },
      { show: true, open: true },
    );

    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      "my-overlay",
    );
  });
});

describe("AlertDialogContent - 必须显式选择", () => {
  it("点击遮罩不关闭对话框（dismissOnOverlayClick 恒为 false）", () => {
    const setOpen = vi.fn();
    // 即使调用方显式传 dismissOnOverlayClick 也拦不住：组件在 spread 之后
    // 硬编码为 false（AlertDialog 的「必须显式选择」语义）。
    const withDismiss = {
      dismissOnOverlayClick: true,
    } as unknown as Parameters<typeof AlertDialogContent>[0];
    renderIn(
      () => <AlertDialogContent {...withDismiss}>正文</AlertDialogContent>,
      { show: true, open: true, setOpen },
    );

    const overlay = document.querySelector(
      '[data-slot="dialog-overlay"]',
    ) as HTMLElement;
    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);

    expect(setOpen).not.toHaveBeenCalled();
    expect(surface()).toHaveAttribute("data-open", "true");
  });

  it("遮罩仍是 aria-hidden 的 presentation（由 DialogSurface 复用 DialogOverlay）", () => {
    renderIn(() => <AlertDialogContent>正文</AlertDialogContent>, {
      show: true,
      open: true,
    });

    const overlay = document.querySelector(
      '[data-slot="dialog-overlay"]',
    ) as HTMLElement;
    expect(overlay).toHaveAttribute("role", "presentation");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay).toHaveAttribute("data-open", "true");
  });
});

describe("AlertDialogContent - overlayClass（回归）", () => {
  it("overlayClass 既能通过类型检查，也真的落到遮罩上", () => {
    // 此前 AlertDialogContentProps 漏传 DialogSurfaceProps，
    // `overlayClass` / `dismissOnOverlayClick` 在类型层直接报 TS2322
    render(() => (
      <AlertDialog defaultOpen>
        <AlertDialogContent overlayClass="my-overlay">内容</AlertDialogContent>
      </AlertDialog>
    ));

    expect(document.querySelector(".my-overlay")).not.toBeNull();
  });
});
