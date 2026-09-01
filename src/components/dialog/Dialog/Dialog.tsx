import { createEffect, createMemo, createSignal, splitProps } from "solid-js";
import type { DialogProps } from "./Dialog.types";
import { DialogContext } from "./Dialog.context";

export const Dialog = (props: DialogProps) => {
  const [local, others] = splitProps(props, [
    "open",
    "defaultOpen",
    "onOpenChange",
    "children",
  ]);

  const initialOpen = local.open ?? local.defaultOpen ?? false;

  // 实际显示或卸载信号
  const [show, setShow] = createSignal(initialOpen);
  // 内部动画控制信号（非受控模式）
  const [internalOpen, setInternalOpen] = createSignal(
    local.defaultOpen ?? false,
  );
  // 实际动画控制状态：优先取受控 open，否则取内部状态
  const open = createMemo(() =>
    local.open === undefined ? internalOpen() : local.open,
  );

  const setOpen = (next: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(next);
    }
    local.onOpenChange?.(next);
  };

  // 打开时立刻挂载；关闭时保留挂载直到动画结束，由 Content/Overlay 的
  // onAnimationEnd 负责卸载，保证退场动画能完整播放。
  createEffect(() => {
    if (open()) {
      setShow(true);
    }
  });

  return (
    <DialogContext.Provider
      value={{
        show,
        setShow,
        open,
        setOpen,
      }}
    >
      <div data-slot="dialog" {...others}>
        {local.children}
      </div>
    </DialogContext.Provider>
  );
};
