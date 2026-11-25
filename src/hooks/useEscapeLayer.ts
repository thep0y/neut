import { createEffect, onCleanup, type Accessor } from "solid-js";

interface EscapeLayer {
  id: symbol;
  onEscape: (event: KeyboardEvent) => void;
}

const layers: EscapeLayer[] = [];
let listening = false;

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.isComposing || event.defaultPrevented) {
    return;
  }
  // 监听器只在栈非空时注册，且 push/pop 同步完成；这里必有栈顶。
  const top = layers[layers.length - 1]!;
  event.preventDefault();
  top.onEscape(event);
}

function syncListener() {
  if (typeof document === "undefined") return;
  if (layers.length > 0 && !listening) {
    document.addEventListener("keydown", onDocumentKeyDown);
    listening = true;
  } else if (layers.length === 0 && listening) {
    document.removeEventListener("keydown", onDocumentKeyDown);
    listening = false;
  }
}

export interface UseEscapeLayerOptions {
  /** 该层当前是否参与 Escape 栈 */
  enabled: Accessor<boolean>;
  /** 只有栈顶层会收到 Escape */
  onEscape: (event: KeyboardEvent) => void;
}

/**
 * 共享 Escape 层栈：后打开的浮层压在先打开的上面，只有栈顶处理 Escape。
 *
 * 之前 Dialog/Popover/Drawer/Select 各自往 document 加 keydown，一次 Escape
 * 会把整叠浮层全部关掉。层栈只负责“谁处理”，真正的关闭仍由各组件回调完成。
 */
export function useEscapeLayer(options: UseEscapeLayerOptions): void {
  const id = Symbol("escape-layer");

  createEffect(() => {
    if (!options.enabled()) return;

    const layer: EscapeLayer = { id, onEscape: options.onEscape };
    layers.push(layer);
    syncListener();

    onCleanup(() => {
      const index = layers.findIndex((item) => item.id === id);
      // 每个层只 cleanup 一次，id 必然还在栈里。
      layers.splice(index, 1);
      syncListener();
    });
  });
}
