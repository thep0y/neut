import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { attachmentGroupClasses } from "./AttachmentGroup.styles";
import type { AttachmentGroupProps } from "./AttachmentGroup.types";

/** 横向可滚动、吸附对齐的附件行，两端带渐隐 */
export const AttachmentGroup = (props: AttachmentGroupProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div
      {...rest}
      data-slot="attachment-group"
      class={clsx(attachmentGroupClasses, local.class)}
      classList={local.classList}
    />
  );
};
