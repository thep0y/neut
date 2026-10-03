import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { AlertDialogAction } from "~/components/alert-dialog/AlertDialogAction/AlertDialogAction";
import buttonStyles from "~/components/button/Button.styles";
import { clsx } from "~/utils";
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

describe("AlertDialogAction", () => {
  it("默认渲染 primary 按钮，带 alert 的 data-slot", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogAction>确认</AlertDialogAction>
    ));
    const action = getByRole("button", { name: "确认" });

    expect(action.tagName).toBe("BUTTON");
    expect(action).toHaveAttribute("data-slot", "alert-dialog-action");
    // AlertDialogAction 不覆盖 Button 的默认变体
    expect(action).toHaveClass(
      ...clsx(buttonStyles({ variant: "primary", size: "md" })).split(" "),
    );
  });

  it("点击时关闭对话框", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogAction>确认</AlertDialogAction>,
      { open: true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "确认" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("先转发用户自己的 onClick（带事件对象），再关闭对话框", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogAction onClick={onClick}>确认</AlertDialogAction>,
      { open: true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "确认" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(onClick.mock.invocationCallOrder[0]).toBeLessThan(
      setOpen.mock.invocationCallOrder[0],
    );
  });

  it("没有传 onClick 时点击不报错，仍然关闭", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogAction>确认</AlertDialogAction>,
      { open: true, setOpen },
    );

    expect(() =>
      fireEvent.click(getByRole("button", { name: "确认" })),
    ).not.toThrow();
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("透传 variant/size 等 Button 属性", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogAction variant="destructive" size="lg">
        删除
      </AlertDialogAction>
    ));
    const action = getByRole("button", { name: "删除" });

    expect(action).toHaveClass(
      ...clsx(buttonStyles({ variant: "destructive", size: "lg" })).split(" "),
    );
    expect(action).not.toHaveClass(
      ...clsx(buttonStyles({ variant: "primary" })).split(" "),
    );
  });
});
