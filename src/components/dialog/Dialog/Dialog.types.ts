import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseDialogProps {
  /**
   * 受控打开状态；不传则由 Dialog 内部自管理。
   * 传入后可以通过外部状态直接打开/关闭 Dialog。
   */
  open?: boolean;
  /** 非受控模式下的初始打开状态 */
  defaultOpen?: boolean;
  /** 打开状态变化时回调 */
  onOpenChange?: (open: boolean) => void;
}

export type DialogProps = PolymorphicProps<
  "div",
  BaseProps & BaseDialogProps,
  false
>;
