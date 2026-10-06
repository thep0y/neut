import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";

/**
 * dropdown-menu 组件层测试的私有脚手架（与 context-menu 的同名文件对齐）。
 *
 * 根组件不渲染 DOM，菜单项又必须在 `DropdownMenuContent` 内部（依赖 popup
 * context）才能注册与工作，所以统一提供一个"已打开的真实菜单树"。
 */
export function renderOpenMenu(
  children: () => JSX.Element,
  rootProps: Record<string, unknown> = {},
) {
  return render(() => (
    <DropdownMenu defaultOpen {...rootProps}>
      <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
      <DropdownMenuContent>{children()}</DropdownMenuContent>
    </DropdownMenu>
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

/** 菜单项在 onMount 里注册到父浮层，交互前先 flush 两轮微任务 */
export async function waitForMount(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
