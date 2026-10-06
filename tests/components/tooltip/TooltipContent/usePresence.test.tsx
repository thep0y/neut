import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EXIT_FALLBACK_MS,
  usePresence,
} from "~/components/tooltip/TooltipContent/usePresence";

function setup(
  initial: { visible?: boolean; element?: HTMLElement | undefined } = {},
  consumeSuppressExitAnimation = vi.fn(() => false),
) {
  const [visible, setVisible] = createSignal(initial.visible ?? false);
  const element =
    "element" in initial ? initial.element : document.createElement("div");
  const [target, setTarget] = createSignal<HTMLElement | undefined>(element);

  const hook = renderHook(() =>
    usePresence({
      visible,
      element: target,
      consumeSuppressExitAnimation,
    }),
  );

  return { ...hook, setVisible, setTarget, consumeSuppressExitAnimation };
}

function animationEnd(element: HTMLElement) {
  element.dispatchEvent(new Event("animationend", { bubbles: true }));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePresence 进入", () => {
  it("初始可见时 mounted 为 true", () => {
    const { result } = setup({ visible: true });

    expect(result()).toBe(true);
  });

  it("初始不可见时 mounted 为 false", () => {
    const { result } = setup();

    expect(result()).toBe(false);
  });

  it("从不可见变为可见时挂载", () => {
    const { result, setVisible } = setup();

    setVisible(true);

    expect(result()).toBe(true);
  });

  it("默认兜底延迟是 300ms", () => {
    expect(EXIT_FALLBACK_MS).toBe(300);
  });
});

describe("usePresence 退场", () => {
  it("可见变不可见时保持挂载，等元素自身 animationend 才卸载", () => {
    const element = document.createElement("div");
    const { result, setVisible } = setup({ visible: true, element });

    setVisible(false);
    expect(result()).toBe(true);

    animationEnd(element);
    expect(result()).toBe(false);
  });

  it("忽略子元素冒泡上来的 animationend", () => {
    const element = document.createElement("div");
    const child = document.createElement("span");
    element.appendChild(child);
    const { result, setVisible } = setup({ visible: true, element });

    setVisible(false);
    animationEnd(child);

    expect(result()).toBe(true);

    animationEnd(element);
    expect(result()).toBe(false);
  });

  it("没有动画时由兜底定时器卸载", () => {
    const element = document.createElement("div");
    const { result, setVisible } = setup({ visible: true, element });

    setVisible(false);
    vi.advanceTimersByTime(EXIT_FALLBACK_MS - 1);
    expect(result()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(result()).toBe(false);
  });

  it("被抢占时跳过退场动画立即卸载", () => {
    const element = document.createElement("div");
    const consume = vi.fn(() => true);
    const { result, setVisible, consumeSuppressExitAnimation } = setup(
      { visible: true, element },
      consume,
    );

    setVisible(false);

    expect(consumeSuppressExitAnimation).toHaveBeenCalled();
    expect(result()).toBe(false);
  });

  it("之前就不可见且没有元素时保持卸载", () => {
    const { result } = setup({ element: undefined });

    expect(result()).toBe(false);
  });

  it("退场过程中元素被清空时不报错（仍等兜底）", () => {
    const element = document.createElement("div");
    const { result, setVisible, setTarget } = setup({ visible: true, element });

    setVisible(false);
    setTarget(undefined);

    expect(() => vi.advanceTimersByTime(EXIT_FALLBACK_MS)).not.toThrow();
    expect(result()).toBe(false);
  });
});
