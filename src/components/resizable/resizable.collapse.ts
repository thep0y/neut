import { isCollapsedSize } from "./resizable.constraints";
import type { ResizablePanelMeta } from "./resizable.types";

/**
 * 折叠相关的决策与记忆。
 *
 * 单一职责：回答两个问题——"这次切换该折还是该展"（纯决策）与
 * "展开时回到哪个尺寸"（记忆）。都不碰 store、不读信号，
 * 决策只依赖相邻面板的 `collapsible` 与当前尺寸。
 */

export interface CollapseAction {
  id: string;
  action: "collapse" | "expand";
}

/**
 * 分隔条上的 Enter/Space 该对谁做什么：
 * 优先取相邻对里**前一个**可折叠面板，没有则取后一个；都不行则不动作。
 */
export function nextCollapseAction(
  adjacent: { prev: ResizablePanelMeta; next: ResizablePanelMeta },
  getSize: (id: string) => number,
): CollapseAction | undefined {
  const target = [adjacent.prev, adjacent.next].find((meta) =>
    meta.collapsible(),
  );
  if (!target) return undefined;

  return {
    id: target.id,
    action: isCollapsedSize(target, getSize(target.id)) ? "expand" : "collapse",
  };
}

export interface CollapseMemory {
  /** 折叠前记下尺寸，供展开时还原 */
  remember(id: string, size: number): void;
  /** 取回记忆中的尺寸；没有记忆时用调用方给的兜底值 */
  recall(id: string, fallback: number): number;
}

export function createCollapseMemory(): CollapseMemory {
  const memory = new Map<string, number>();

  return {
    remember(id, size) {
      memory.set(id, size);
    },
    recall(id, fallback) {
      return memory.get(id) ?? fallback;
    },
  };
}
