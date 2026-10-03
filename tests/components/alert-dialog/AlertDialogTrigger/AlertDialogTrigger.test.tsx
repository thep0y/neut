import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { AlertDialogTrigger } from "~/components/alert-dialog/AlertDialogTrigger/AlertDialogTrigger";
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

describe("AlertDialogTrigger - 渲染与多态", () => {
  it("默认渲染 button，带 alert 的 data-slot 与 aria-haspopup", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogTrigger>删除</AlertDialogTrigger>
    ));
    const trigger = getByRole("button", { name: "删除" });

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("component 指定自定义标签时按该标签渲染并保留契约属性", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogTrigger component="a" href="#delete">
        删除
      </AlertDialogTrigger>
    ));
    const trigger = getByRole("link", { name: "删除" });

    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("href", "#delete");
    expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
  });

  it("透传用户自己的 onClick，不被内部监听覆盖", () => {
    const onClick = vi.fn();
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogTrigger onClick={onClick}>删除</AlertDialogTrigger>,
      { setOpen },
    );

    fireEvent.click(getByRole("button", { name: "删除" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("把元素通过 ref 交给调用方", () => {
    const userRef = vi.fn();
    const { getByRole } = renderIn(() => (
      <AlertDialogTrigger
        ref={(el) => {
          userRef(el);
        }}
      >
        删除
      </AlertDialogTrigger>
    ));
    const trigger = getByRole("button", { name: "删除" });

    expect(userRef).toHaveBeenCalledWith(trigger);
  });
});

describe("AlertDialogTrigger - 开关状态", () => {
  it("关闭时 aria-expanded=false、data-state=closed", () => {
    const { getByRole } = renderIn(
      () => <AlertDialogTrigger>删除</AlertDialogTrigger>,
      { open: false },
    );
    const trigger = getByRole("button", { name: "删除" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
  });

  it("打开时 aria-expanded=true、data-state=open", () => {
    const { getByRole } = renderIn(
      () => <AlertDialogTrigger>删除</AlertDialogTrigger>,
      { open: true },
    );
    const trigger = getByRole("button", { name: "删除" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("data-state", "open");
  });

  it("点击时打开对话框", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogTrigger>删除</AlertDialogTrigger>,
      { setOpen },
    );

    fireEvent.click(getByRole("button", { name: "删除" }));

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("已打开时点击不再重复打开", () => {
    const setOpen = vi.fn();
    const { getByRole } = renderIn(
      () => <AlertDialogTrigger>删除</AlertDialogTrigger>,
      { open: true, setOpen },
    );

    fireEvent.click(getByRole("button", { name: "删除" }));

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("disabled 时渲染为禁用按钮", () => {
    const { getByRole } = renderIn(() => (
      <AlertDialogTrigger disabled>删除</AlertDialogTrigger>
    ));

    expect(getByRole("button", { name: "删除" })).toBeDisabled();
  });
});
