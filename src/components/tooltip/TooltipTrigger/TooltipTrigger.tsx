import { children, type JSXElement, type ParentProps } from "solid-js";
import { useTooltipTrigger } from "./useTooltipTrigger";

export const TooltipTrigger = (props: ParentProps) => {
  const resolved = children(() => props.children);

  useTooltipTrigger(resolved);

  return resolved as unknown as JSXElement;
};
