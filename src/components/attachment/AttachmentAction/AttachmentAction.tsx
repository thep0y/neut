import { mergeProps } from "solid-js";
import { Button } from "~/components/button";
import type { AttachmentActionProps } from "./AttachmentAction.types";

/** 操作按钮：复用 Button，默认 ghost + 图标尺寸 */
export const AttachmentAction = (props: AttachmentActionProps) => {
  const merged = mergeProps({ variant: "ghost", size: "xs" } as const, props);

  return <Button {...merged} data-slot="attachment-action" />;
};
