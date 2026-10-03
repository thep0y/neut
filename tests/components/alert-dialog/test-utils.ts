import { createComponent, createSignal, type ParentProps } from "solid-js";
import { DialogContext } from "~/components/dialog/Dialog/Dialog.context";
import { DialogContentContext } from "~/components/dialog/DialogContent/DialogContent.context";

/**
 * AlertDialog 测试脚手架。
 *
 * AlertDialog 复用 Dialog 的运行时，部件（Action/Cancel/Overlay/Content/
 * Title/Description/Trigger）都通过 `useDialogContext` /
 * `useDialogContentContext` 消费根状态。单测这些部件时用一个「假 context」
 * 驱动确定性输入，整机行为另由 `alert-dialog.integration.test.tsx` 覆盖
 * 真实组件树。
 *
 * 这不是 mock 被测对象本身（TESTING.md §4.5）：被测的是渲染与接线，
 * 状态机由 Dialog 的集成用例覆盖（与本仓库 drawer 的脚手架同一思路）。
 */
export interface FakeDialogContextOverrides {
  open?: boolean;
  show?: boolean;
  setOpen?: (open: boolean) => void;
}

export function fakeDialogContext(overrides: FakeDialogContextOverrides = {}) {
  const [open, setOpen] = createSignal(overrides.open ?? false);
  const [show, setShow] = createSignal(
    overrides.show ?? overrides.open ?? false,
  );

  return {
    open,
    show,
    setShow,
    setOpen: (next: boolean) => {
      setOpen(next);
      overrides.setOpen?.(next);
    },
  };
}

export function dialogContextWrapper(
  value: ReturnType<typeof fakeDialogContext>,
) {
  return (props: ParentProps) =>
    createComponent(DialogContext.Provider, {
      value,
      get children() {
        return props.children;
      },
    });
}

/**
 * DialogContentContext 的假实现：暴露两个真实的 signal，
 * 便于断言 Title/Description 挂载时把 id 注册了进来。
 */
export function fakeDialogContentContext() {
  const [titleID, setTitleID] = createSignal<string | undefined>();
  const [descriptionID, setDescriptionID] = createSignal<string | undefined>();

  return { titleID, descriptionID, setTitleID, setDescriptionID };
}

export function dialogContentWrapper(
  value: ReturnType<typeof fakeDialogContentContext>,
) {
  return (props: ParentProps) =>
    createComponent(DialogContentContext.Provider, {
      value,
      get children() {
        return props.children;
      },
    });
}
