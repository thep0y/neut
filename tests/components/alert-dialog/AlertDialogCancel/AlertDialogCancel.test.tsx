import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { AlertDialogCancel } from "~/components/alert-dialog/AlertDialogCancel/AlertDialogCancel";
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

describe("AlertDialogCancel", () => {
  it("默认渲染 outline + md 的按钮，带 alert 的 data-slot", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogCancel>取消</AlertDialogCancel>
    ));
    const cancel = getByRole("button", { name: "取消" });

    expect(cancel.tagName).toBe("BUTTON");
    expect(cancel).toHaveAttribute("data-slot", "alert-dialog-cancel");
    expect(cancel).toHaveClass(
      ...clsx(buttonStyles({ variant: "outline", size: "md" })).split(" "),
    );
  });

  it("用户传入的 variant/size 覆盖默认值", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogCancel variant="link" size="lg">
        取消
      </AlertDialogCancel>
    ));
    const cancel = getByRole("button", { name: "取消" });

    expect(cancel).toHaveClass(
      ...clsx(buttonStyles({ variant: "link", size: "lg" })).split(" "),
    );
    expect(cancel).not.toHaveClass(
      ...clsx(buttonStyles({ variant: "outline" })).split(" "),
    );
  });

  it("点击时关闭对话框", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogCancel>取消</AlertDialogCancel>,
      { open: true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "取消" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("先转发用户自己的 onClick，再关闭对话框（回归）", () => {
    // 此前这一行 `onClick={() => setOpen(false)}` 写在 {...merged} 之后，
    // 把调用方的 onClick 静默替换掉了（同级的 AlertDialogAction 会转发）
    const onClick = vi.fn();
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogCancel onClick={onClick}>取消</AlertDialogCancel>,
      { open: true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "取消" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("用户 onClick 里读到的是真实按钮事件", () => {
    const seen: string[] = [];
    const { getByRole } = renderIn(
      () => (
        <AlertDialogCancel
          onClick={(event) => {
            seen.push((event?.currentTarget as HTMLElement).tagName);
          }}
        >
          取消
        </AlertDialogCancel>
      ),
      { open: true, setOpen: vi.fn() },
    );

    fireEvent.click(getByRole("button", { name: "取消" }));

    expect(seen).toEqual(["BUTTON"]);
  });
});
