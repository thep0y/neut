import { createUniqueId, type JSXElement } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type {
  ExternalToast,
  PromiseT,
  ToastT,
  ToastTypes,
} from "../Toast/Toast.types";

/**
 * 全部 toast 的单一数据源。
 *
 * 只在本模块内写入：外部通过 `useSonner()` 读取、通过下面三个原语修改，
 * 保证"列表怎么变"只有一处实现（更新同 id、标记删除、真正移除）。
 */
const [toasts, setToasts] = createStore<ToastT[]>([]);

export function useSonner() {
  return { toasts };
}

export function getToasts() {
  return toasts;
}

export function getHistory() {
  return toasts;
}

export type CreateToastInput = ExternalToast & {
  message?: JSXElement;
  type?: ToastTypes;
  jsx?: JSXElement;
  promise?: PromiseT;
};

/**
 * 新建一条 toast；同 id 已存在时原地更新（`message` 缺省则保留原标题）。
 * 新 toast 插到队首，因此列表顺序天然是"新 → 旧"。
 */
export function createToast(data: CreateToastInput): string {
  const id = data.id ?? createUniqueId();

  setToasts(
    produce((list) => {
      const existing = list.find((toast) => toast.id === id);
      const next: ToastT = {
        ...data,
        id,
        title: data.message,
        dismissible: data.dismissible ?? true,
      } as ToastT;

      if (existing) {
        Object.assign(existing, next, {
          title: data.message ?? existing.title,
        });
      } else {
        list.unshift(next);
      }
    }),
  );

  return id;
}

/** 标记退场：真正的移除发生在退场动画结束后（由 Toast 调 `removeToast`）。 */
export function dismissToast(id?: string) {
  setToasts(
    produce((list) => {
      if (id !== undefined) {
        const toast = list.find((item) => item.id === id);
        if (toast) toast.delete = true;
        return;
      }
      for (const toast of list) toast.delete = true;
    }),
  );

  return id;
}

export function removeToast(id: string) {
  setToasts(
    produce((list) => {
      const index = list.findIndex((toast) => toast.id === id);
      if (index !== -1) list.splice(index, 1);
    }),
  );
}
