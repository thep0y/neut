import { Dialog } from "~/components/dialog";
import type { AlertDialogProps } from "./AlertDialog.types";

/**
 * AlertDialog 复用 Dialog 的实现（受控/非受控状态机、Portal、Overlay、动画、
 * Title/Description 的 id 注入、滚动锁定），只在内容层保留自己的差异：
 * `role="alertdialog"`、无关闭按钮、点击外部不关闭。
 */
export const AlertDialog = (props: AlertDialogProps) => {
  return <Dialog {...props} data-slot="alert-dialog" />;
};
