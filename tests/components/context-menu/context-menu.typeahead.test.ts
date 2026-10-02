import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TYPEAHEAD_TIMEOUT,
  createTypeahead,
} from "~/components/context-menu/context-menu.typeahead";

const CANDIDATES = [
  { id: "copy", label: "复制" },
  { id: "paste", label: "粘贴" },
  { id: "banana", label: "Banana" },
];

function setup(
  options: {
    candidates?: { id: string; label: string }[];
    timeoutMs?: number;
  } = {},
) {
  const onMatch = vi.fn();
  const typeahead = createTypeahead({
    candidates: () => options.candidates ?? CANDIDATES,
    onMatch,
    timeoutMs: options.timeoutMs,
  });

  return { typeahead, onMatch };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createTypeahead", () => {
  it("默认窗口是 500ms", () => {
    expect(TYPEAHEAD_TIMEOUT).toBe(500);
  });

  it("单个字符匹配第一个以它开头的候选（大小写不敏感）", () => {
    const { typeahead, onMatch } = setup();

    typeahead.handle("B");

    expect(onMatch).toHaveBeenCalledWith("banana");
  });

  it("连续输入会攒成前缀，匹配更长的候选", () => {
    const { typeahead, onMatch } = setup();

    typeahead.handle("b");
    typeahead.handle("a");
    typeahead.handle("n");

    expect(onMatch).toHaveBeenLastCalledWith("banana");
  });

  it("中文标签同样按前缀匹配", () => {
    const { typeahead, onMatch } = setup();

    typeahead.handle("粘");

    expect(onMatch).toHaveBeenCalledWith("paste");
  });

  it("没有候选以该前缀开头时不回调", () => {
    const { typeahead, onMatch } = setup();

    typeahead.handle("z");

    expect(onMatch).not.toHaveBeenCalled();
  });

  it("候选列表为空时不回调也不报错", () => {
    const { typeahead, onMatch } = setup({ candidates: [] });

    expect(() => typeahead.handle("a")).not.toThrow();
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("窗口到期后缓冲清空，同样输入从头匹配", () => {
    const { typeahead, onMatch } = setup();

    typeahead.handle("b");
    typeahead.handle("a");
    expect(onMatch).toHaveBeenLastCalledWith("banana");

    vi.advanceTimersByTime(500);

    // 缓冲已重置：单字符 "a" 不再匹配 banana，而候选里没有以 a 开头的项
    onMatch.mockClear();
    typeahead.handle("a");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("未到期时的连续输入共用同一窗口（每次输入都会续期）", () => {
    const { typeahead, onMatch } = setup();

    typeahead.handle("b");
    vi.advanceTimersByTime(400);
    typeahead.handle("a");
    vi.advanceTimersByTime(400);

    // 续期后仍在窗口内：再输 "n" 会匹配到 banana
    typeahead.handle("n");
    expect(onMatch).toHaveBeenLastCalledWith("banana");
  });

  it("支持自定义窗口长度", () => {
    const { typeahead, onMatch } = setup({ timeoutMs: 100 });

    typeahead.handle("b");
    vi.advanceTimersByTime(100);

    onMatch.mockClear();
    typeahead.handle("a");
    expect(onMatch).not.toHaveBeenCalled();
  });

  it("dispose 会清掉未到期的定时器", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { typeahead, onMatch } = setup();

    typeahead.handle("b");
    const callsBefore = clearTimeoutSpy.mock.calls.length;
    typeahead.dispose();

    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callsBefore);

    // 定时器已被清掉：缓冲不会因过期而重置
    onMatch.mockClear();
    typeahead.handle("a");
    expect(onMatch).toHaveBeenLastCalledWith("banana");
  });

  it("没有待清定时器时 dispose 是空操作", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { typeahead } = setup();

    expect(() => typeahead.dispose()).not.toThrow();
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });
});
