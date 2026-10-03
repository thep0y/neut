import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  ToastCloseButton,
  isCloseButtonVisible,
} from "~/components/toast/Toast/ToastCloseButton";
import type { ToastT } from "~/components/toast/Toast/Toast.types";

function toast(extra: Partial<ToastT> = {}): ToastT {
  return { id: "t1", title: "已保存", ...extra };
}

describe("ToastCloseButton", () => {
  it("默认无障碍名是 Close toast", () => {
    const { container } = render(() => <ToastCloseButton onClose={vi.fn()} />);

    expect(container.querySelector("button")).toHaveAccessibleName(
      "Close toast",
    );
    expect(container.querySelector("button")).toHaveAttribute(
      "data-slot",
      "toast-close",
    );
  });

  it("支持自定义无障碍名与类名", () => {
    const { container } = render(() => (
      <ToastCloseButton
        ariaLabel="关闭通知"
        class="close-extra"
        onClose={vi.fn()}
      />
    ));

    const button = container.querySelector("button") as HTMLElement;
    expect(button).toHaveAccessibleName("关闭通知");
    expect(button).toHaveClass("close-extra");
  });

  it("点击回调 onClose", () => {
    const onClose = vi.fn();
    const { container } = render(() => <ToastCloseButton onClose={onClose} />);

    fireEvent.click(container.querySelector("button") as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("isCloseButtonVisible", () => {
  it("显式开启且可关闭时可见", () => {
    expect(isCloseButtonVisible(toast(), true)).toBe(true);
  });

  it("未开启时不可见", () => {
    expect(isCloseButtonVisible(toast(), false)).toBe(false);
  });

  it("dismissible=false 时不可见", () => {
    expect(isCloseButtonVisible(toast({ dismissible: false }), true)).toBe(
      false,
    );
  });

  it("loading 类型是常驻的，不可见", () => {
    expect(isCloseButtonVisible(toast({ type: "loading" }), true)).toBe(false);
  });
});
