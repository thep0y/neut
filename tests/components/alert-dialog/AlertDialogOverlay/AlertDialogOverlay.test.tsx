import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { AlertDialogOverlay } from "~/components/alert-dialog/AlertDialogOverlay/AlertDialogOverlay";
import {
  dialogContextWrapper,
  fakeDialogContext,
} from "~tests/components/alert-dialog/test-utils";

/** AlertDialogOverlay 把 props 原样转给 DialogOverlay，后者多一个 dismissOnOverlayClick */
type OverlayProps = Parameters<typeof AlertDialogOverlay>[0] & {
  dismissOnOverlayClick?: boolean;
};

function renderOverlay(
  props: OverlayProps = {},
  overrides: Parameters<typeof fakeDialogContext>[0] = {},
) {
  return render(() => <AlertDialogOverlay {...props} />, {
    wrapper: dialogContextWrapper(fakeDialogContext(overrides)),
  });
}

function overlay(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-overlay"]',
  ) as HTMLElement;
}

describe("AlertDialogOverlay", () => {
  it("渲染带 alert data-slot 的装饰层，并保留 presentation 语义", () => {
    renderOverlay(undefined, { open: true });

    expect(overlay()).toHaveAttribute("data-slot", "alert-dialog-overlay");
    expect(overlay()).toHaveAttribute("role", "presentation");
    expect(overlay()).toHaveAttribute("aria-hidden", "true");
  });

  it("data-open 跟随开关：打开 true、关闭 false", () => {
    const { unmount } = renderOverlay(undefined, { open: true });
    expect(overlay()).toHaveAttribute("data-open", "true");

    unmount();
    renderOverlay(undefined, { open: false });
    expect(overlay()).toHaveAttribute("data-open", "false");
  });

  it("默认点击遮罩请求关闭（alert 的 Content 会关掉这个默认值）", () => {
    const setOpen = vi.fn();
    renderOverlay(undefined, { open: true, setOpen });

    fireEvent.click(overlay());

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("dismissOnOverlayClick=false 时点击遮罩只转发用户 onClick，不关闭", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    renderOverlay(
      { onClick, dismissOnOverlayClick: false },
      { open: true, setOpen },
    );

    fireEvent.click(overlay());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    renderOverlay({
      class: "my-overlay",
      classList: { "is-dark": true },
      "data-testid": "overlay-extra",
    } as OverlayProps);

    expect(overlay()).toHaveClass("my-overlay");
    expect(overlay()).toHaveClass("is-dark");
    expect(overlay()).toHaveAttribute("data-testid", "overlay-extra");
  });
});
