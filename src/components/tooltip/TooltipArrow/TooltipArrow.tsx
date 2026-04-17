import { clsx } from "~/lib/utils";
import { useTooltipContentContext } from "../TooltipContent/TooltipContent.context";

export const TooltipArrow = () => {
  const { side } = useTooltipContentContext();

  return (
    <div
      data-side={side()}
      class={clsx(
        "absolute size-2.5 z-50 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs bg-neutral-950 dark:bg-neutral-50 fill-neutral-950 dark:fill-neutral-50 data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-[0.175rem] data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-[0.175rem] data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5 data-[side=top]:left-1/2 data-[side=top]:-translate-x-1/2 data-[side=bottom]:left-1/2 data-[side=bottom]:-translate-x-1/2",
      )}
    />
  );
};
