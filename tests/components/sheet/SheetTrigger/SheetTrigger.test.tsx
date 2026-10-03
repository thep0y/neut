import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { SheetTrigger } from "~/components/sheet/SheetTrigger/SheetTrigger";
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

describe("SheetTrigger - 渲染与多态", () => {
  it("默认渲染 button，带 sheet 的 data-slot 与 aria-haspopup", () => {
    const { getByRole } = renderIn(() => <SheetTrigger>打开</SheetTrigger>);
    const trigger = getByRole("button", { name: "打开" });

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("data-slot", "sheet-trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("component 指定自定义标签时按该标签渲染并保留契约属性", () => {
    const { getByRole } = renderIn(() => (
      <SheetTrigger component="a" href="#sheet">
        打开
      </SheetTrigger>
    ));
    const trigger = getByRole("link", { name: "打开" });

    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("href", "#sheet");
    expect(trigger).toHaveAttribute("data-slot", "sheet-trigger");
  });

  it("透传用户自己的 onClick，不被内部监听覆盖", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <SheetTrigger onClick={onClick}>打开</SheetTrigger>,
      { setOpen },
    );

    fireEvent.click(getByRole("button", { name: "打开" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("把元素通过 ref 交给调用方", () => {
    const userRef = vi.fn();
    const { getByRole } = renderIn(() => (
      <SheetTrigger
        ref={(el) => {
          userRef(el);
        }}
      >
        打开
      </SheetTrigger>
    ));
    const trigger = getByRole("button", { name: "打开" });

    expect(userRef).toHaveBeenCalledWith(trigger);
  });
});

describe("SheetTrigger - 开关状态", () => {
  it("关闭时 aria-expanded=false、data-state=closed", () => {
    const { getByRole } = renderIn(() => <SheetTrigger>打开</SheetTrigger>, {
      open: false,
    });
    const trigger = getByRole("button", { name: "打开" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
  });

  it("打开时 aria-expanded=true、data-state=open", () => {
    const { getByRole } = renderIn(() => <SheetTrigger>打开</SheetTrigger>, {
      open: true,
    });
    const trigger = getByRole("button", { name: "打开" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("data-state", "open");
  });

  it("点击时打开面板", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(() => <SheetTrigger>打开</SheetTrigger>, {
      setOpen,
    });

    fireEvent.click(getByRole("button", { name: "打开" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("已打开时点击不再重复打开", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(() => <SheetTrigger>打开</SheetTrigger>, {
      open: true,
      setOpen,
    });

    fireEvent.click(getByRole("button", { name: "打开" }));

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("disabled 时渲染为禁用按钮", () => {
    const { getByRole } = renderIn(() => (
      <SheetTrigger disabled>打开</SheetTrigger>
    ));

    expect(getByRole("button", { name: "打开" })).toBeDisabled();
  });
});
