import { createUniqueId, onCleanup, onMount, splitProps } from "solid-js";
import type { DialogTitleProps } from "./DialogTitle.types";
import { clsx } from "~/utils";
import { classes } from "./DialogTitle.styles";
import { useDialogContentContext } from "../DialogContent";

export const DialogTitle = (props: DialogTitleProps) => {
  const { setTitleID } = useDialogContentContext();

  const [local, others] = splitProps(props, ["class", "classList"]);

  const id = createUniqueId();

  onMount(() => {
    setTitleID(id);
  });
  // 条件卸载标题时清掉自己写入的 id，避免 aria-labelledby 指向已移除节点。
  onCleanup(() => setTitleID(undefined));

  return (
    <h2
      id={id}
      data-slot="dialog-title"
      class={clsx(classes, local.class)}
      classList={local.classList}
      {...others}
    />
  );
};
