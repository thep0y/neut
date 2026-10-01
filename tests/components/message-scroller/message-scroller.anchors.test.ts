import { describe, expect, it } from "vitest";
import {
  firstAnchorFrom,
  firstUnhandledAnchor,
  hasMultipleAnchorsFrom,
} from "~/components/message-scroller/message-scroller.anchors";

/** 构造一个带（或不带）`data-scroll-anchor` 的行元素 */
function row(anchor: boolean, label = ""): HTMLElement {
  const el = document.createElement("div");
  if (anchor) el.dataset.scrollAnchor = "true";
  el.textContent = label;
  return el;
}

describe("firstAnchorFrom", () => {
  it("从指定下标起返回第一个锚点", () => {
    const list = [row(false, "a"), row(true, "b"), row(true, "c")];

    expect(firstAnchorFrom(list, 0)).toBe(list[1]);
  });

  it("跳过 from 之前的锚点", () => {
    const list = [row(true, "a"), row(false, "b"), row(true, "c")];

    expect(firstAnchorFrom(list, 1)).toBe(list[2]);
  });

  it("from 指向的本身就是锚点时直接返回", () => {
    const list = [row(false), row(true, "b")];

    expect(firstAnchorFrom(list, 1)).toBe(list[1]);
  });

  it("后面没有锚点时返回 null", () => {
    const list = [row(false), row(false)];

    expect(firstAnchorFrom(list, 0)).toBeNull();
  });

  it("空列表返回 null", () => {
    expect(firstAnchorFrom([], 0)).toBeNull();
  });

  it("from 超出长度时返回 null", () => {
    const list = [row(true)];

    expect(firstAnchorFrom(list, 5)).toBeNull();
  });

  it("稀疏数组中的空位被跳过（不抛错）", () => {
    const list: HTMLElement[] = [row(true, "a")];
    list[3] = row(true, "d");

    expect(firstAnchorFrom(list, 1)).toBe(list[3]);
  });
});

describe("firstUnhandledAnchor", () => {
  it("返回第一个未被处理过的锚点", () => {
    const handled = new WeakSet<HTMLElement>();
    const list = [row(true, "a"), row(true, "b")];
    handled.add(list[0]);

    expect(firstUnhandledAnchor(list, handled)).toBe(list[1]);
  });

  it("非锚点行被忽略", () => {
    const list = [row(false, "a"), row(true, "b")];

    expect(firstUnhandledAnchor(list, new WeakSet())).toBe(list[1]);
  });

  it("没有未处理的锚点时返回 null", () => {
    const handled = new WeakSet<HTMLElement>();
    const list = [row(true, "a")];
    handled.add(list[0]);

    expect(firstUnhandledAnchor(list, handled)).toBeNull();
  });

  it("空列表返回 null", () => {
    expect(firstUnhandledAnchor([], new WeakSet())).toBeNull();
  });
});

describe("hasMultipleAnchorsFrom", () => {
  it("从 from 起有两个锚点时返回 true", () => {
    const list = [row(false), row(true, "b"), row(true, "c")];

    expect(hasMultipleAnchorsFrom(list, 1)).toBe(true);
  });

  it("只有一个锚点时返回 false", () => {
    const list = [row(false), row(true, "b"), row(false)];

    expect(hasMultipleAnchorsFrom(list, 1)).toBe(false);
  });

  it("from 之前的锚点不计入", () => {
    const list = [row(true, "a"), row(true, "b")];

    expect(hasMultipleAnchorsFrom(list, 1)).toBe(false);
  });

  it("空列表返回 false", () => {
    expect(hasMultipleAnchorsFrom([], 0)).toBe(false);
  });

  it("锚点数量很多时提前返回 true（计数到 2 即停）", () => {
    const list = [row(false), row(true), row(true), row(true)];

    expect(hasMultipleAnchorsFrom(list, 0)).toBe(true);
  });
});
