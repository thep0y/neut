/**
 * Resizable 的布局持久化。
 *
 * 单一职责：把布局读写到 `Storage`（默认 localStorage）。
 * 所有异常都被吞掉——隐私模式、配额超限、损坏的 JSON 都不应让组件崩溃。
 */

import type { ResizableLayout } from "./resizable.types";

export const STORAGE_PREFIX = "neut-resizable:";

/** 由 `autoSaveId` 得到 storage key；未配置时返回 undefined（表示不持久化） */
export function storageKey(autoSaveId: string | undefined): string | undefined {
  return autoSaveId ? `${STORAGE_PREFIX}${autoSaveId}` : undefined;
}

/** 解析显式传入的 storage，缺省回退到 localStorage（SSR 下为 undefined） */
export function resolveStorage(
  explicit: Storage | undefined,
): Storage | undefined {
  if (explicit) return explicit;
  return typeof localStorage !== "undefined" ? localStorage : undefined;
}

export interface PersistContext {
  autoSaveId: string | undefined;
  storage: Storage | undefined;
}

/** 写入布局；失败时静默忽略 */
export function persistLayout(
  context: PersistContext,
  layout: ResizableLayout,
): void {
  const key = storageKey(context.autoSaveId);
  const storage = resolveStorage(context.storage);
  if (!key || !storage) return;
  try {
    storage.setItem(key, JSON.stringify(layout));
  } catch {
    // 隐私模式等场景下忽略持久化失败
  }
}

/**
 * 读取已保存的布局。
 * 只有「非 null 的对象」才被接受（防止 JSON 里存了 `null` / 数字 / 字符串）。
 */
export function readSavedLayout(
  context: PersistContext,
): ResizableLayout | undefined {
  const key = storageKey(context.autoSaveId);
  const storage = resolveStorage(context.storage);
  if (!key || !storage) return undefined;
  try {
    const raw = storage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as ResizableLayout)
      : undefined;
  } catch {
    return undefined;
  }
}
