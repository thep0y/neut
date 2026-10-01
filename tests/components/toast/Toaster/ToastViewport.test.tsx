import { fireEvent, render } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ToastViewport,
  type ToastViewportProps,
} from "~/components/toast/Toaster/ToastViewport";
import type { ToastT } from "~/components/toast/Toast/Toast.types";

function toast(id: string, extra: Partial<ToastT> = {}): ToastT {
  return { id, title: id, ...extra };
}

/** jsdom 的 rAF 依赖真实帧时钟，同步化后 Toast 的 data-state 才可断言 */
function stubSyncRaf() {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
}

function renderViewport(props: Partial<ToastViewportProps> = {}) {
  const onExpandChange = vi.fn();
  const onRemove = vi.fn();
  const result = render(() => (
    <ToastViewport
      position="bottom-right"
      toasts={[]}
      expanded={false}
      gap={14}
      ariaLabel="Notifications"
      onExpandChange={onExpandChange}
      onRemove={onRemove}
      {...props}
    />
  ));

  const viewport = () =>
    result.container.querySelector(
      '[data-slot="toaster-viewport"]',
    ) as HTMLElement;
  const toasts = () =>
    Array.from(
      result.container.querySelectorAll('[data-slot="toast"]'),
    ) as HTMLElement[];

  return { ...result, viewport, toasts, onExpandChange, onRemove };
}

beforeEach(() => {
  vi.useFakeTimers();
  stubSyncRaf();
});

describe("ToastViewport 语义与排布", () => {
  it("渲染 live region 语义与位置标记", () => {
    const { viewport } = renderViewport();

    expect(viewport().tagName).toBe("OL");
    expect(viewport()).toHaveAttribute("data-slot", "toaster-viewport");
    expect(viewport()).toHaveAttribute("data-position", "bottom-right");
    expect(viewport()).toHaveAttribute("aria-live", "polite");
    expect(viewport()).toHaveAttribute("aria-relevant", "additions text");
    expect(viewport()).toHaveAttribute("aria-atomic", "false");
    expect(viewport()).toHaveAttribute("aria-label", "Notifications");
    expect(viewport()).toHaveAttribute("tabindex", "-1");
  });

  it("收起时用 grid 叠放", () => {
    const { viewport } = renderViewport();

    expect(viewport()).toHaveClass("grid");
  });

  it("展开时底部位置反向排列", () => {
    const { viewport } = renderViewport({ expanded: true });

    expect(viewport()).toHaveClass("flex-col-reverse");
    expect(viewport()).not.toHaveClass("grid");
  });

  it("展开时顶部位置正向排列", () => {
    const { viewport } = renderViewport({
      position: "top-center",
      expanded: true,
    });

    expect(viewport()).toHaveClass("flex-col");
    expect(viewport()).not.toHaveClass("flex-col-reverse");
  });

  it("gap 与 offset 写进样式，额外 style 追加", () => {
    const { viewport } = renderViewport({
      gap: 20,
      offset: 32,
      mobileOffset: 8,
      style: { "max-width": "420px" },
    });

    expect(viewport().style.gap).toBe("20px");
    expect(viewport().style.bottom).toBe("32px");
    expect(viewport().style.getPropertyValue("--mobile-offset-bottom")).toBe(
      "8px",
    );
    expect(viewport().style.maxWidth).toBe("420px");
  });

  it("悬停进入/离开时报告展开态变化", () => {
    const { viewport, onExpandChange } = renderViewport();

    fireEvent.mouseEnter(viewport());
    expect(onExpandChange).toHaveBeenLastCalledWith(true);

    fireEvent.mouseLeave(viewport());
    expect(onExpandChange).toHaveBeenLastCalledWith(false);
  });
});

describe("ToastViewport 逐条渲染", () => {
  it("按顺序渲染每条 toast", () => {
    const { toasts } = renderViewport({
      toasts: [toast("a"), toast("b")],
    });

    expect(toasts().map((node) => node.dataset.type)).toEqual([
      "default",
      "default",
    ]);
    expect(toasts()[0]).toHaveTextContent("a");
    expect(toasts()[1]).toHaveTextContent("b");
  });

  it("closeButton 优先级：单条 > toastOptions > 根级", () => {
    const { toasts } = renderViewport({
      closeButton: true,
      toastOptions: { closeButton: true },
      toasts: [toast("a", { closeButton: false }), toast("b")],
    });

    expect(toasts()[0].querySelector('[data-slot="toast-close"]')).toBeNull();
    expect(
      toasts()[1].querySelector('[data-slot="toast-close"]'),
    ).not.toBeNull();
  });

  it("duration 优先级：单条 > toastOptions > 根级", () => {
    const { toasts } = renderViewport({
      duration: 5000,
      toastOptions: { duration: 1000 },
      toasts: [toast("a", { duration: 200 }), toast("b")],
    });

    vi.advanceTimersByTime(200);
    expect(toasts()[0]).toHaveAttribute("data-state", "closed");
    expect(toasts()[1]).toHaveAttribute("data-state", "open");
  });

  it("toastOptions.class 追加到每条 toast", () => {
    const { toasts } = renderViewport({
      toastOptions: { class: "option-class" },
      toasts: [toast("a")],
    });

    expect(toasts()[0]).toHaveClass("option-class");
  });

  it("icons 映射按类型下发", () => {
    const { container } = renderViewport({
      icons: { success: <span data-icon="ok" /> },
      toasts: [toast("a", { type: "success" })],
    });

    expect(container.querySelector('[data-icon="ok"]')).not.toBeNull();
  });

  it("richColors 作为默认值下发", () => {
    const { toasts } = renderViewport({
      richColors: true,
      toasts: [toast("a")],
    });

    expect(toasts()[0]).toHaveAttribute("data-rich-colors", "true");
  });

  it("closeButtonAriaLabel 下发给关闭按钮", () => {
    const { toasts } = renderViewport({
      closeButton: true,
      toastOptions: { closeButtonAriaLabel: "关闭这条通知" },
      toasts: [toast("a")],
    });

    expect(
      toasts()[0].querySelector('[data-slot="toast-close"]'),
    ).toHaveAccessibleName("关闭这条通知");
  });

  it("退场动画结束后用 onRemove 移除对应 id", () => {
    const { toasts, onRemove } = renderViewport({
      closeButton: true,
      toasts: [toast("a")],
    });

    fireEvent.click(
      toasts()[0].querySelector('[data-slot="toast-close"]') as HTMLElement,
    );
    vi.advanceTimersByTime(200);

    expect(onRemove).toHaveBeenCalledWith("a");
  });
});
