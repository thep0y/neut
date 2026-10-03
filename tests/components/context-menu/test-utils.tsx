import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { ContextMenuContent } from "~/components/context-menu/ContextMenuContent/ContextMenuContent";
import { ContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/ContextMenuTrigger";

/**
 * context-menu 组件层测试的私有脚手架。
 *
 * 根组件不渲染 DOM，浮层里的菜单项又必须在 `ContextMenuContent` 内部
 * （依赖 popup context）才能工作，所以这里统一提供一个"已打开的真实菜单树"。
 * `children` 用函数延迟到 render 回调内求值，保证拿到正确的 owner 与 context。
 */
export function renderOpenMenu(
  children: () => JSX.Element,
  rootProps: Record<string, unknown> = {},
) {
  return render(() => (
    <ContextMenu defaultOpen {...rootProps}>
      <ContextMenuTrigger>右键区域</ContextMenuTrigger>
      <ContextMenuContent>{children()}</ContextMenuContent>
    </ContextMenu>
  ));
}

export function slot(name: string): HTMLElement | null {
  return document.querySelector(`[data-slot="${name}"]`);
}

export function slots(name: string): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
  );
}

/**
 * 等待挂载完成。
 *
 * 菜单项在 `onMount` 里把自己登记到父浮层，`render()` 与随后的事件
 * 可能落在同一个 tick 内；显式 flush 两轮微任务模拟"已挂载"。
 */
export async function waitForMount(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
