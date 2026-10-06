import { render } from "@solidjs/testing-library";
import { For, createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageScroller } from "~/components/message-scroller/MessageScroller/MessageScroller";
import { MessageScrollerButton } from "~/components/message-scroller/MessageScrollerButton/MessageScrollerButton";
import { MessageScrollerContent } from "~/components/message-scroller/MessageScrollerContent/MessageScrollerContent";
import { MessageScrollerItem } from "~/components/message-scroller/MessageScrollerItem/MessageScrollerItem";
import { MessageScrollerProvider } from "~/components/message-scroller/MessageScrollerProvider/MessageScrollerProvider";
import { MessageScrollerViewport } from "~/components/message-scroller/MessageScrollerViewport/MessageScrollerViewport";
import {
  flushFrames,
  setScrollMetrics,
  stubRect,
} from "~tests/components/message-scroller/test-utils";

/**
 * 整机集成：把 Provider + 五个部件按文档结构拼起来，验证它们与**真实引擎**的接线
 * （单元测试用的是假 Context，这里补上"部件确实把元素/状态交给引擎"这一层）。
 *
 * jsdom 不做布局，因此挂载后显式 stub 视口与各行的矩形（TESTING.md §4.5）。
 */

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

interface Row {
  id: string;
  height: number;
  anchor?: boolean;
}

type ScrollerProps = Partial<{
  autoScroll: boolean;
  defaultScrollPosition: "start" | "end" | "last-anchor";
  scrollPreviousItemPeek: number;
}>;

/** 挂一棵完整的会话树；返回可控的消息列表与几何 stub 工具 */
function mountSession(
  initialProps: ScrollerProps = {},
  initialRows: Row[] = [],
) {
  const [rows, setRows] = createSignal<Row[]>(initialRows);
  const [props, setProps] = createSignal<ScrollerProps>(initialProps);
  let viewport: HTMLElement | undefined;
  const scrollToCalls: Array<{ top: number; behavior?: string }> = [];

  const { container, unmount } = render(() => (
    <MessageScrollerProvider
      autoScroll={props().autoScroll ?? false}
      defaultScrollPosition={props().defaultScrollPosition ?? "start"}
      scrollPreviousItemPeek={props().scrollPreviousItemPeek ?? 64}
    >
      <MessageScroller>
        <MessageScrollerViewport
          ref={(element) => {
            viewport = element as HTMLElement;
          }}
        >
          <MessageScrollerContent>
            <For each={rows()}>
              {(row) => (
                <MessageScrollerItem
                  messageId={row.id}
                  scrollAnchor={row.anchor}
                >
                  {row.id}
                </MessageScrollerItem>
              )}
            </For>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  ));

  const viewportOf = () => viewport!;

  /** 视口 400 高、可滚 1600，并记录 scrollTo 调用 */
  const layoutViewport = () => {
    const element = viewportOf();
    setScrollMetrics(element, { scrollHeight: 2000, clientHeight: 400 });
    stubRect(element, { top: 0, bottom: 400, height: 400 });
    Object.defineProperty(element, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
    element.scrollTo = ((arg: ScrollToOptions | number) => {
      const top = typeof arg === "number" ? arg : (arg.top ?? 0);
      scrollToCalls.push({
        top,
        behavior: typeof arg === "number" ? undefined : arg.behavior,
      });
      element.scrollTop = top;
    }) as typeof element.scrollTo;
    return element;
  };

  /** 行按给定偏移排列，矩形与当前 scrollTop 自洽 */
  const layoutRows = (offsets: Record<string, number>) => {
    const element = viewportOf();
    for (const row of rows()) {
      const node = container.querySelector<HTMLElement>(
        `[data-message-id="${row.id}"]`,
      );
      if (!node) continue;
      const offset = offsets[row.id] ?? 0;
      const top = offset - element.scrollTop;
      stubRect(node, { top, bottom: top + row.height, height: row.height });
    }
  };

  const itemOf = (id: string) =>
    container.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
  const buttonOf = () =>
    container.querySelector<HTMLButtonElement>(
      '[data-slot="message-scroller-button"]',
    );

  return {
    container,
    unmount,
    rows,
    setRows,
    setProps,
    layoutViewport,
    layoutRows,
    viewportOf,
    itemOf,
    buttonOf,
    scrollToCalls,
  };
}

describe("message-scroller 集成 - 初始定位", () => {
  it("defaultScrollPosition=start 停在顶部", async () => {
    const session = mountSession({ defaultScrollPosition: "start" }, []);
    session.layoutViewport();
    session.setRows([{ id: "m1", height: 900 }]);
    await flushFrames();

    expect(session.viewportOf().scrollTop).toBe(0);
    session.unmount();
  });

  it("defaultScrollPosition=end 滚到底，且空会话不会留下遮罩", async () => {
    const session = mountSession({ defaultScrollPosition: "end" }, []);
    session.layoutViewport();
    const frame = session.container.querySelector(
      '[data-slot="message-scroller"]',
    );
    // 空会话不隐藏视口（data-pending-scroll 跳过）
    expect(frame?.hasAttribute("data-pending-scroll")).toBe(false);

    session.setRows([{ id: "m1", height: 900 }]);
    await flushFrames();

    expect(session.viewportOf().scrollTop).toBe(1600);
    expect(frame?.hasAttribute("data-pending-scroll")).toBe(false);
    session.unmount();
  });
});

describe("message-scroller 集成 - 跟随与让位", () => {
  it("autoScroll 开启时追加内容跟到新底部", async () => {
    const session = mountSession({ autoScroll: true }, [
      { id: "m1", height: 900 },
    ]);
    session.layoutViewport();
    session.layoutRows({ m1: 0 });
    await flushFrames();
    // 初始 start：先滚到实时边缘进入 following
    session.viewportOf().scrollTop = 1600;
    session.layoutRows({ m1: 0 });
    session.viewportOf().dispatchEvent(new Event("scroll"));
    await flushFrames();

    session.setRows([
      { id: "m1", height: 900 },
      { id: "m2", height: 300 },
    ]);
    session.layoutRows({ m1: 0, m2: 900 });
    await flushFrames();

    expect(session.viewportOf().scrollTop).toBe(1600);
    session.unmount();
  });

  it("滚轮让位后追加内容不再跟随", async () => {
    const session = mountSession({ autoScroll: true }, [
      { id: "m1", height: 900 },
    ]);
    session.layoutViewport();
    session.layoutRows({ m1: 0 });
    await flushFrames();
    session.viewportOf().scrollTop = 1600;
    session.layoutRows({ m1: 0 });
    session.viewportOf().dispatchEvent(new Event("scroll"));
    await flushFrames();

    session.viewportOf().dispatchEvent(new Event("wheel"));
    session.setRows([
      { id: "m1", height: 900 },
      { id: "m2", height: 300 },
    ]);
    session.layoutRows({ m1: 0, m2: 900 });
    await flushFrames();

    expect(session.viewportOf().scrollTop).toBe(1600 - 0);
    session.unmount();
  });
});

describe("message-scroller 集成 - 新回合锚定", () => {
  it("追加 scrollAnchor 行时把它顶到阅读线并保留上一项", async () => {
    const session = mountSession(
      { defaultScrollPosition: "start", scrollPreviousItemPeek: 64 },
      [{ id: "m1", height: 300 }],
    );
    session.layoutViewport();
    session.layoutRows({ m1: 0 });
    await flushFrames();

    session.setRows([
      { id: "m1", height: 300 },
      { id: "m2", height: 300, anchor: true },
    ]);
    session.layoutRows({ m1: 0, m2: 300 });
    await flushFrames();

    // target = 300 - peek 64
    expect(session.viewportOf().scrollTop).toBe(236);
    session.unmount();
  });
});

describe("message-scroller 集成 - 滚动按钮", () => {
  it("不可滚时按钮 inert、tabIndex=-1；可滚时点击滚到底并失焦", async () => {
    const session = mountSession({ defaultScrollPosition: "start" }, []);
    session.layoutViewport();
    // 先 stub 几何再让内容出现：内容变化会带着已知尺寸重新提交状态
    session.setRows([{ id: "m1", height: 900 }]);
    session.layoutRows({ m1: 0 });
    await flushFrames();

    const button = session.buttonOf()!;
    // 内容 900 > 400 → 还能向下滚
    expect(button.inert).toBe(false);
    expect(button.getAttribute("data-active")).toBe("true");

    button.focus();
    button.click();
    await flushFrames();

    expect(session.scrollToCalls.at(-1)).toMatchObject({
      top: 1600,
      behavior: "smooth",
    });
    expect(document.activeElement).not.toBe(button);
    session.unmount();
  });

  it("内容放得下时按钮 inert 且点击不发命令", async () => {
    const session = mountSession({ defaultScrollPosition: "start" }, []);
    session.layoutViewport();
    session.setRows([{ id: "m1", height: 100 }]);
    session.layoutRows({ m1: 0 });
    await flushFrames();

    const button = session.buttonOf()!;
    expect(button.inert).toBe(true);
    expect(button.getAttribute("tabindex")).toBe("-1");

    button.click();
    expect(session.scrollToCalls).toHaveLength(0);
    session.unmount();
  });
});

describe("message-scroller 集成 - 行注册与跳转", () => {
  it("可通过按钮/命令滚动到指定消息", async () => {
    const session = mountSession({ defaultScrollPosition: "start" }, []);
    session.layoutViewport();
    session.setRows([
      { id: "m1", height: 300 },
      { id: "m2", height: 300 },
    ]);
    session.layoutRows({ m1: 0, m2: 300 });
    await flushFrames();
    expect(session.itemOf("m2")).not.toBeNull();

    // 点按钮滚到底（等价于 scrollToEnd）
    session.viewportOf().dispatchEvent(new Event("scroll"));
    await flushFrames();
    session.buttonOf()!.click();

    expect(session.scrollToCalls.at(-1)?.top).toBe(1600);
    session.unmount();
  });
});
