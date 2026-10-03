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
    // 初始挂载不会产生 MutationObserver 能观察到的 childList 变更，但题目的
    // ref 是在"插入文档之前"执行的：这里再自增一次版本号，让排序 memo 在
    // 节点真正连上文档之后重算一次（否则顺序会停在"按注册顺序"的初值上）。
    setVersion((v) => v + 1);
    onCleanup(() => observer.disconnect());
  });

  return version;
}
