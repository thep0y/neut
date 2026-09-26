import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { attachmentDescriptionClasses } from "./AttachmentDescription.styles";
import type { AttachmentDescriptionProps } from "./AttachmentDescription.types";

/** 次要信息：文件类型、大小、上传状态 */
export const AttachmentDescription = (props: AttachmentDescriptionProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <span
      {...rest}
      data-slot="attachment-description"
      class={clsx(attachmentDescriptionClasses, local.class)}
      classList={local.classList}
    />
  );
};
