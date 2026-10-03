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

  it("观察 root，配置为 childList + subtree", () => {
    const form = document.createElement("form");
    const { result } = setup(form);

    expect(result()).toBe(0);
    expect(typeof MutationObserver).toBe("function");

    // 真的插入一个子节点：观察生效则版本号自增
    form.appendChild(document.createElement("fieldset"));

    return flushObserver().then(() => {
      expect(result()).toBe(1);
    });
  });

  it("每次 DOM 变化都自增（可被 memo 依赖）", async () => {
    const form = document.createElement("form");
    const { result } = setup(form);

    form.appendChild(document.createElement("fieldset"));
    await flushObserver();
    form.appendChild(document.createElement("fieldset"));
    await flushObserver();

    expect(result()).toBe(2);
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
