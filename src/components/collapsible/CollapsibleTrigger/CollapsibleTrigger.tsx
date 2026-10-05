import { useCollapsibleContext } from "../Collapsible";
import type { CollapsibleTriggerProps } from "./CollapsibleTrigger.types";
import { Button } from "~/components/button";
import { callEventHandler } from "~/utils";

export const CollapsibleTrigger = (props: CollapsibleTriggerProps) => {
  const { onOpenChange, open, setInternalOpen } = useCollapsibleContext();

  const handleClick = (event: MouseEvent) => {
    const next = !open();
    setInternalOpen(next);
    onOpenChange?.(next);
    // 必须把事件透传给用户的 onClick（此前是 `props.onClick?.()`——用户回调
    // 收到的是 undefined，而且数组/绑定形式根本不会被调用）
    callEventHandler(props.onClick, event);
  };

  return (
    <Button
      {...props}
      data-slot="collapsible-trigger"
      data-panel-open={open()}
      aria-expanded={open()}
      onClick={handleClick}
    />
  );
};
