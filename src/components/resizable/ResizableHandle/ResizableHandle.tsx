import {
  Show,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from "solid-js";
import { clsx } from "~/utils";
import { useResizablePanelGroupContext } from "../resizable.context";
import { gripClasses, handleClasses } from "./ResizableHandle.styles";
import { useResizableHandle } from "./useResizableHandle";
import type { ResizableHandleProps } from "../resizable.types";

/**
 * 两个面板之间的分隔条:支持拖拽、方向键、Home/End、Enter/Space 折叠。
 * 默认只有 1px 可见线,靠 `::after` 扩大命中区域;`withHandle` 时显示抓手。
 */
export function ResizableHandle(props: ResizableHandleProps) {
  const ctx = useResizablePanelGroupContext("ResizableHandle");
  const merged = mergeProps({ disabled: false, withHandle: false }, props);
  const [local, rest] = splitProps(merged, [
    "class",
    "classList",
    "id",
    "disabled",
    "withHandle",
    "onDragging",
    "children",
  ]);

  const [element, setElement] = createSignal<HTMLElement>();
  const adjacent = () => {
    const el = element();
    return el ? ctx.resolveAdjacent(el) : undefined;
  };

  const handlers = useResizableHandle({
    disabled: () => local.disabled,
    onDragging: (dragging) => local.onDragging?.(dragging),
  });

  // 分隔条方向与 group 垂直:group 横向时是一条竖线
  const separatorOrientation = () =>
    ctx.orientation() === "horizontal" ? "vertical" : "horizontal";

  return (
    <div
      {...rest}
      ref={(el) => {
        setElement(el);
        onCleanup(() => setElement(undefined));
      }}
      id={local.id}
      role="separator"
      aria-orientation={separatorOrientation()}
      aria-valuenow={Math.round(adjacent()?.prevSize ?? 0)}
      aria-valuemin={0}
      aria-valuemax={Math.round(adjacent()?.total ?? 100)}
      tabIndex={local.disabled ? -1 : 0}
      data-slot="resizable-handle"
      data-orientation={ctx.orientation()}
      data-disabled={local.disabled ? "" : undefined}
      data-dragging={ctx.dragging() ? "" : undefined}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onKeyDown={handlers.onKeyDown}
      class={clsx(handleClasses, local.class)}
      classList={local.classList}
    >
      <Show when={local.withHandle}>
        <div class={gripClasses} />
      </Show>
      {local.children}
    </div>
  );
}
