import {
  type Accessor,
  type Setter,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type { Position, ToastT } from "../Toast/Toast.types";

export interface UseToasterOptions {
  /** 当前 Toaster 要展示的全部 toast（由 state 层提供，便于独立测试） */
  toasts: Accessor<ToastT[]>;
  /** 只展示属于该 toasterId 的 toast；缺省时展示无归属的 toast */
  toasterId: Accessor<string | undefined>;
  position: Accessor<Position>;
  visibleToasts: Accessor<number>;
  expand: Accessor<boolean | undefined>;
  hotkey: Accessor<string[]>;
}

export interface ToasterState {
  /** 展开态：悬停、热键或 `expand` 置位时为 true */
  expanded: Accessor<boolean>;
  setExpanded: Setter<boolean>;
  /** 需要渲染的视口位置（默认位置 + toast 自带位置去重） */
  possiblePositions: Accessor<Position[]>;
  /** 某个视口下真正要渲染的 toast（含 visibleToasts 截断） */
  visibleToastsForPosition: (position: Position) => ToastT[];
}

/**
 * Toaster 的"选择与展开"算法：从一堆 toast 里挑出当前 Toaster 该渲染的那些、
 * 归到各自的位置视口，并维护展开态（悬停由渲染层调用 `setExpanded`）。
 *
 * 这里不读全局 store —— `toasts` 由调用方注入，算法本身可以脱离 store 单独推理。
 */
export function useToaster(options: UseToasterOptions): ToasterState {
  const [expanded, setExpanded] = createSignal(false);

  const filteredToasts = createMemo(() => {
    const id = options.toasterId();
    return id
      ? options.toasts().filter((toast) => toast.toasterId === id)
      : options.toasts().filter((toast) => !toast.toasterId);
  });

  // 每个 toast 可以指定自己的位置，因此视口集合是"默认位置 + 出现过的位置"去重
  const possiblePositions = createMemo(() =>
    Array.from(
      new Set(
        [options.position()].concat(
          filteredToasts()
            .filter((toast) => toast.position)
            .map((toast) => toast.position as Position),
        ),
      ),
    ),
  );

  const toastsForPosition = (position: Position) =>
    filteredToasts().filter((toast) => {
      if (toast.position) return toast.position === position;
      return position === options.position();
    });

  const visibleToastsForPosition = (position: Position) => {
    const list = toastsForPosition(position);
    if (options.expand()) return list;
    return list.slice(0, options.visibleToasts());
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hotkeyPressed =
        options.hotkey().length > 0 &&
        options
          .hotkey()
          .every((key) => (event as any)[key] || event.code === key);
      if (hotkeyPressed) setExpanded(true);
      if (event.code === "Escape") setExpanded(false);
    };

    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
  });

  return { expanded, setExpanded, possiblePositions, visibleToastsForPosition };
}
