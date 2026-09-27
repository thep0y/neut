import { Show, onCleanup, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import { getAlignment, getSide, getTransformOrigin } from "~/lib";
import { clsx } from "~/utils";
import { useHoverCardContent } from "./useHoverCardContent";
import type { HoverCardContentProps } from "../hover-card.types";

/**
 * HoverCard 浮层:Portal 到 body,position:fixed 定位。
 * 内容可交互——鼠标移入取消关闭计时(keepOpen),移出才走 closeDelay。
 */
export function HoverCardContent(props: HoverCardContentProps) {
  const { ctx, pos, mounted, animationState, setContentElement } =
    useHoverCardContent(() => props);

  const [local, rest] = splitProps(props, [
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
    "class",
    "style",
    "children",
  ]);

  return (
    <Show when={mounted()}>
      <Portal>
        <div
          ref={(el) => {
            ctx.setFloating(el);
            onCleanup(() => ctx.setFloating(undefined));
          }}
          data-placement={pos.placement()}
          style={{
            ...pos.floatingStyles(),
            "z-index": 1000,
            opacity: pos.isPositioned() ? 1 : 0,
          }}
        >
          <div
            {...rest}
            ref={setContentElement}
            id={ctx.contentId}
            role="dialog"
            data-slot="hover-card-content"
            data-state={animationState()}
            data-side={getSide(pos.placement())}
            data-align={getAlignment(pos.placement()) ?? "center"}
            onMouseEnter={ctx.keepOpen}
            onMouseLeave={() => ctx.requestClose()}
            style={{
              "transform-origin": getTransformOrigin(pos.placement()),
              ...(typeof local.style === "object" ? local.style : undefined),
            }}
            class={clsx(
              "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
              local.class,
            )}
          >
            {local.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
