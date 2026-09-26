import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { attachmentActionsClasses } from "./AttachmentActions.styles";
import type { AttachmentActionsProps } from "./AttachmentActions.types";

/** 操作区容器，对齐到附件末端 */
export const AttachmentActions = (props: AttachmentActionsProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div
      {...rest}
      data-slot="attachment-actions"
      class={clsx(attachmentActionsClasses, local.class)}
      classList={local.classList}
    />
  );
};
