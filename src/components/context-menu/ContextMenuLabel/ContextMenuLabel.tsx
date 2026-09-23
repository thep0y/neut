import { createUniqueId, onCleanup, onMount, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useContextMenuGroup } from "../context-menu.context";
import { contextMenuLabelClass } from "../context-menu.styles";
import type { ContextMenuLabelProps } from "./ContextMenuLabel.types";

/**
 * 分组标题。挂载时把自身 id 注册给父级 `<ContextMenuGroup>`,
 * 由后者写到 `aria-labelledby` 上。
 */
export function ContextMenuLabel(props: ContextMenuLabelProps) {
  const group = useContextMenuGroup("ContextMenuLabel");
  const [local, rest] = splitProps(props, ["class", "children", "inset"]);
  const id = `context-menu-label-${createUniqueId()}`;

  onMount(() => {
    group.setLabelId(id);
    onCleanup(() => group.setLabelId(undefined));
  });

  return (
    <div
      id={id}
      data-slot="context-menu-label"
      data-inset={local.inset ? "" : undefined}
      class={clsx(contextMenuLabelClass, local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
}
