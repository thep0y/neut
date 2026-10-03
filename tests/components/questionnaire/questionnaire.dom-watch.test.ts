import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDomVersionWatcher } from "~/components/questionnaire/questionnaire.dom-watch";

function setup(initial: Element | undefined = undefined) {
  const [root, setRoot] = createSignal<Element | undefined>(initial);
  const hook = renderHook(() => createDomVersionWatcher(root));

  return { ...hook, setRoot };
}

/** MutationObserver 的回调是异步投递的，等一轮微任务 */
const flushObserver = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createDomVersionWatcher", () => {
  it("初始版本号为 0", () => {
    const { result } = setup();

    expect(result()).toBe(0);
  });

  it("根元素为 undefined 时不报错也不开始观察", () => {
    const observe = vi.fn();
    vi.stubGlobal(
      "MutationObserver",
      class {
        observe = observe;
        disconnect = vi.fn();
      },
    );

    const { result } = setup(undefined);

    expect(result()).toBe(0);
    expect(observe).not.toHaveBeenCalled();
  });

  it("环境不支持 MutationObserver 时保持 0（SSR）", () => {
    vi.stubGlobal("MutationObserver", undefined);
    const element = document.createElement("form");

    const { result } = setup(element);

    expect(result()).toBe(0);
  });

  it("观察 root，配置为 childList + subtree，并在挂载时先自增一次", () => {
    const form = document.createElement("form");
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const { result } = setup(form);

    // 挂载时先自增一次：题目的 ref 早于节点插入文档，排序 memo 需要这次
    // 失效才能在节点连上文档后按真实 DOM 顺序重排（否则顺序会颠倒）
    expect(result()).toBe(1);
    const options = observe.mock.calls.at(-1)?.[1] as MutationObserverInit;
    expect(options).toMatchObject({ childList: true, subtree: true });

    // 真的插入一个子节点：观察生效则版本号继续自增
    form.appendChild(document.createElement("fieldset"));

    return flushObserver().then(() => {
      expect(result()).toBe(2);
    });
  });

  it("每次 DOM 变化都自增（可被 memo 依赖）", async () => {
    const form = document.createElement("form");
    const { result } = setup(form);
    const initial = result();

    form.appendChild(document.createElement("fieldset"));
    await flushObserver();
    form.appendChild(document.createElement("fieldset"));
    await flushObserver();

    expect(result()).toBe(initial + 2);
  });

  it("root 换成新元素后改为观察新元素并断开旧的", async () => {
    const first = document.createElement("form");
    const second = document.createElement("form");
    // 默认 spy 会透传真实实现，因此旧的 observer 确实会被断开
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const callsBefore = disconnect.mock.calls.length;

    const { result, setRoot } = setup(first);
    setRoot(second);

    await flushObserver();
    expect(disconnect.mock.calls.length).toBeGreaterThan(callsBefore);

    // 旧元素的变化不再计数，新元素的会
    const before = result();
    first.appendChild(document.createElement("fieldset"));
    await flushObserver();
    expect(result()).toBe(before);

    second.appendChild(document.createElement("fieldset"));
    await flushObserver();
    expect(result()).toBe(before + 1);

    disconnect.mockRestore();
  });

  it("卸载时断开观察", async () => {
    const form = document.createElement("form");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const { cleanup } = setup(form);

    cleanup();

    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
  });
});
