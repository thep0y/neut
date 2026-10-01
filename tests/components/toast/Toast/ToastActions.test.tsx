import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { ToastActions } from "~/components/toast/Toast/ToastActions";
import type { ToastT } from "~/components/toast/Toast/Toast.types";

function renderActions(toast: Partial<ToastT> = {}, onClose = vi.fn()) {
  const result = render(() => (
    <ToastActions
      toast={{ id: "t1", title: "已保存", ...toast }}
      onClose={onClose}
    />
  ));
  return { ...result, onClose };
}

describe("ToastActions", () => {
  it("Action 形态渲染操作按钮并回调 onClick 后请求关闭", () => {
    const onClick = vi.fn();
    const { container, onClose } = renderActions({
      action: { label: "撤销", onClick },
    });

    const button = container.querySelector(
      '[data-slot="toast-action"]',
    ) as HTMLElement;
    expect(button).toHaveTextContent("撤销");

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("onClick 里 preventDefault 时不请求关闭", () => {
    const { container, onClose } = renderActions({
      action: { label: "撤销", onClick: (event) => event.preventDefault() },
    });

    fireEvent.click(
      container.querySelector('[data-slot="toast-action"]') as HTMLElement,
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it("取消项渲染独立的 toast-cancel 插槽", () => {
    const { container } = renderActions({ cancel: { label: "不再提示", onClick: vi.fn() } });

    expect(
      container.querySelector('[data-slot="toast-cancel"]'),
    ).toHaveTextContent("不再提示");
  });

  it("自定义元素形态原样渲染，不生成按钮", () => {
    const { container } = renderActions({
      action: <a href="/undo">撤销</a>,
      cancel: <em>取消</em>,
    });

    expect(container.querySelector("a")).toHaveAttribute("href", "/undo");
    expect(container.querySelector("em")).toHaveTextContent("取消");
    expect(container.querySelector('[data-slot="toast-action"]')).toBeNull();
    expect(container.querySelector('[data-slot="toast-cancel"]')).toBeNull();
  });

  it("没有 action / cancel 时什么都不渲染", () => {
    const { container } = renderActions();

    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector('[data-slot="toast-action"]')).toBeNull();
    expect(container.querySelector('[data-slot="toast-cancel"]')).toBeNull();
  });

  it("classes 里的按钮类名分别下发", () => {
    const { container } = renderActions({
      action: { label: "撤销", onClick: vi.fn() },
      cancel: { label: "取消", onClick: vi.fn() },
      classes: { actionButton: "action-extra", cancelButton: "cancel-extra" },
    });

    expect(container.querySelector('[data-slot="toast-action"]')).toHaveClass(
      "action-extra",
    );
    expect(container.querySelector('[data-slot="toast-cancel"]')).toHaveClass(
      "cancel-extra",
    );
  });
});
