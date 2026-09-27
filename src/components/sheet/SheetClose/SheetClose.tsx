import { Show, mergeProps } from "solid-js";
import { X } from "lucide-solid";
import { Button } from "~/components/button";
import { useDialogContext } from "~/components/dialog";
import type { SheetCloseProps } from "../sheet.types";

/**
 * 关闭 Sheet。复用 Dialog 的 context,默认渲染一个 X 图标按钮;
 * 传 children 时渲染为普通按钮(如 footer 里的 "Cancel")。
 */
export const SheetClose = (props: SheetCloseProps) => {
  const { setOpen } = useDialogContext();

  const merged = mergeProps({ variant: "ghost", size: "sm" } as const, props);

  const handleClick = () => {
    setOpen(false);
    merged.onClick?.();
  };

  return (
    <Show
      when={!merged.icon && !merged.children}
      fallback={
        <Button {...merged} data-slot="sheet-close" onClick={handleClick} />
      }
    >
      <Button
        {...merged}
        data-slot="sheet-close"
        icon={<X />}
        aria-label="Close"
        onClick={handleClick}
      />
    </Show>
  );
};
