import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

/**
 * 监视表单子树里的 DOM 增删，返回一个"每次变化都会自增"的版本号。
 *
 * 单一职责：把结构变化变成一条可被 memo 依赖的响应式边——注册表本身是普通数组，
 * 子节点被移动位置时注册顺序不变，只有 DOM 顺序变了，排序 memo 需要这条边才会重算。
 * 环境不支持 `MutationObserver`（SSR）时不做任何事，版本号恒为 0。
 */
export function createDomVersionWatcher(
  root: Accessor<Element | undefined>,
): Accessor<number> {
  const [version, setVersion] = createSignal(0);

  createEffect(() => {
    const element = root();
    if (!element || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(element, { childList: true, subtree: true });
    onCleanup(() => observer.disconnect());
  });

  return version;
}
