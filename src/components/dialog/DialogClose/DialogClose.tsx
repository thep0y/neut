import { mergeProps, Show } from "solid-js";
import type { DialogCloseProps } from "./DialogClose.types";
import { Button } from "~/components/button";
import { clsx } from "~/utils";
import { classes } from "./DialogClose.styles";
import { X } from "lucide-solid";
import { useDialogContext } from "../Dialog";

export const DialogClose = (props: DialogCloseProps) => {
  const { setOpen } = useDialogContext();

  const merged = mergeProps(
    {
      variant: "ghost",
      size: "sm",
    } as const,
    props,
  );

  const handleClick = () => {
    setOpen(false);
    merged.onClick?.();
  };

  return (
    <Show
      when={!merged.icon && !merged.children}
      fallback={
        <Button {...merged} data-slot="dialog-close" onClick={handleClick} />
      }
    >
      <Button
        {...merged}
        data-slot="dialog-close"
        class={clsx(classes)}
        onClick={handleClick}
        icon={<X />}
        aria-label="Close Dialog"
      />
    </Show>
  );
};
