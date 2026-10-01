import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { ToastActionButton } from "~/components/toast/Toast/ToastActionButton";

function renderButton(
  props: Partial<Parameters<typeof ToastActionButton>[0]> = {},
) {
  const onClose = vi.fn();
  const onClick = vi.fn();
  const result = render(() => (
    <ToastActionButton
      action={{ label: "撤销", onClick }}
      variant="action"
      onClose={onClose}
      {...props}
    />
  ));

  const button = () =>
    result.container.querySelector("button") as HTMLButtonElement;

  return { ...result, onClose, onClick, button };
}

describe("ToastActionButton", () => {
  it("action 变体渲染 toast-action 插槽", () => {
    const { button } = renderButton({ variant: "action" });

    expect(button()).toHaveAttribute("data-slot", "toast-action");
    expect(button()).toHaveAttribute("type", "button");
    expect(button()).toHaveTextContent("撤销");
  });

  it("cancel 变体渲染 toast-cancel 插槽", () => {
    const { button } = renderButton({ variant: "cancel" });

    expect(button()).toHaveAttribute("data-slot", "toast-cancel");
  });

  it("点击先回调 onClick，再请求关闭", () => {
    const calls: string[] = [];
    const { button, onClose } = renderButton({
      action: {
        label: "撤销",
        onClick: () => {
          calls.push("onClick");
        },
      },
    });
    onClose.mockImplementation(() => {
      calls.push("onClose");
    });

    fireEvent.click(button());

    expect(calls).toEqual(["onClick", "onClose"]);
  });

  it("onClick 调用 preventDefault 时不请求关闭", () => {
    const handler = vi.fn((event: MouseEvent) => event.preventDefault());
    const { button, onClose } = renderButton({
      action: { label: "撤销", onClick: handler },
    });

    fireEvent.click(button());

    expect(handler).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("没有 onClick 时点击仍请求关闭", () => {
    const { button, onClose } = renderButton({
      action: { label: "撤销" } as never,
    });

    fireEvent.click(button());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("追加的 class 透传到按钮", () => {
    const { button } = renderButton({ class: "extra-class" });

    expect(button()).toHaveClass("extra-class");
  });
});
