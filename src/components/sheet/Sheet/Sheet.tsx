import { Dialog } from "~/components/dialog";
import type { SheetProps } from "../sheet.types";

/**
 * Sheet 根:复用 Dialog 的滚动锁定、受控/非受控、动画挂载逻辑,
 * 只把 `data-slot` 换成 sheet。
 */
export function Sheet(props: SheetProps) {
  return <Dialog {...props} data-slot="sheet" />;
}
