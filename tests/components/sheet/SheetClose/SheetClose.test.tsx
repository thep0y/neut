import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import buttonStyles from "~/components/button/Button.styles";
import { SheetClose } from "~/components/sheet/SheetClose/SheetClose";
import { clsx } from "~/utils";
import {
  dialogContextWrapper,
  fakeDialogContext,
} from "~tests/components/sheet/test-utils";

function renderIn(
  ui: () => JSX.Element,
  overrides: Parameters<typeof fakeDialogContext>[0] = {},
) {
  return render(ui, {
    wrapper: dialogContextWrapper(fakeDialogContext(overrides)),
  });
}

function expectedClass(opts: {
  variant: "ghost" | "link";
  size?: "sm" | "lg";
  iconSize?: "sm" | "lg";
}) {
  return clsx(buttonStyles(opts)).split(" ");
}

describe("SheetClose - 默认关闭按钮", () => {
  it("没有 children 与 icon 时渲染带 aria-label 的图标按钮", () => {
    const { getByRole } = renderIn(() => <SheetClose />);
    const close = getByRole("button", { name: "Close" });

    expect(close.tagName).toBe("BUTTON");
    expect(close).toHaveAttribute("data-slot", "sheet-close");
    expect(close).toHaveAttribute("aria-label", "Close");
    expect(close.querySelector("svg")).not.toBeNull();
    // 图标按钮走 iconSize 分支：size-7 而非 h-7
    expect(close).toHaveClass(
      ...expectedClass({ variant: "ghost", iconSize: "sm" }),
    );
  });

  it("点击图标按钮关闭面板", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(() => <SheetClose />, {
      open: true,
      setOpen,
    });

    fireEvent.click(getByRole("button", { name: "Close" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});

describe("SheetClose - 自定义内容", () => {
  it("传 children 时渲染普通按钮而不是图标按钮", () => {
    const { getByRole } = renderIn(() => <SheetClose>取消</SheetClose>);
    const close = getByRole("button", { name: "取消" });

    expect(close).toHaveAttribute("data-slot", "sheet-close");
    expect(close).not.toHaveAttribute("aria-label", "Close");
    expect(close.querySelector("svg")).toBeNull();
  });

  it("只传 icon（无 children）时也走普通按钮分支", () => {
    const { getByRole } = renderIn(() => (
      <SheetClose icon={<span data-testid="my-icon">x</span>} />
    ));
    const close = getByRole("button");

    // 有 icon 时不再叠加内置 X，且保留调用方传入的 aria-label
    expect(close.querySelector('[data-testid="my-icon"]')).not.toBeNull();
    expect(close.querySelector("svg")).toBeNull();
  });

  it("点击时先关闭面板、再调用用户自己的 onClick", () => {
    const setOpen = vi.fn();
    const onClick = vi.fn();
    const { getByRole } = renderIn(
      () => <SheetClose onClick={onClick}>取消</SheetClose>,
      { open: true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "取消" }));

    expect(setOpen).toHaveBeenCalledWith(false);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen.mock.invocationCallOrder[0]).toBeLessThan(
      onClick.mock.invocationCallOrder[0],
    );
  });

  it("没有传 onClick 时点击不报错", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(() => <SheetClose>取消</SheetClose>, {
      setOpen,
    });

    expect(() =>
      fireEvent.click(getByRole("button", { name: "取消" })),
    ).not.toThrow();
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("用户传入的 variant/size 覆盖默认的 ghost/sm", () => {
    const { getByRole } = renderIn(() => (
      <SheetClose variant="link" size="lg">
        取消
      </SheetClose>
    ));
    const close = getByRole("button", { name: "取消" });

    expect(close).toHaveClass(
      ...expectedClass({ variant: "link", size: "lg" }),
    );
    expect(close).not.toHaveClass(
      ...expectedClass({ variant: "ghost", size: "sm" }),
    );
  });

  it("透传 rest 属性（data-* / title 等）到按钮上", () => {
    const { getByRole } = renderIn(() => (
      <SheetClose title="关闭面板" data-testid="close-extra">
        关闭面板
      </SheetClose>
    ));
    const close = getByRole("button", { name: "关闭面板" });

    expect(close).toHaveAttribute("title", "关闭面板");
    expect(close).toHaveAttribute("data-testid", "close-extra");
  });
});
