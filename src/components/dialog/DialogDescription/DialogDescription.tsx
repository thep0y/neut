import { createUniqueId, onCleanup, onMount, splitProps } from "solid-js";
import type { DialogDescriptionProps } from "./DialogDescription.types";
import { clsx } from "~/utils";
import { classes } from "./DialogDescription.styles";
import { useDialogContentContext } from "../DialogContent";

export const DialogDescription = (props: DialogDescriptionProps) => {
  const { setDescriptionID } = useDialogContentContext();

  const [local, others] = splitProps(props, ["class", "classList"]);

  const id = createUniqueId();

  onMount(() => {
    setDescriptionID(id);
  });
  // 条件卸载描述时清掉自己写入的 id，避免 aria-describedby 悬空。
  onCleanup(() => setDescriptionID(undefined));

  return (
    <p
      id={id}
      data-slot="dialog-description"
      class={clsx(classes, local.class)}
      classList={local.classList}
      {...others}
    />
  );
};
