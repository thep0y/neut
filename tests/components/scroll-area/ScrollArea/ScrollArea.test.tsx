import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollBar } from "~/components/scroll-area/ScrollBar";
import { ScrollArea } from "~/components/scroll-area/ScrollArea/ScrollArea";
import { useScrollAreaContext } from "~/components/scroll-area/ScrollArea/ScrollArea.context";
import { computeMetrics } from "~/components/scroll-area/ScrollArea/ScrollArea.utils";

/** 让元素报告指定尺寸（jsdom 的属性只有 getter） */
function setMetrics(
  el: HTMLElement,
  size: {
    clientHeight?: number;
    scrollHeight?: number;
    clientWidth?: number;
    scrollWidth?: number;
  },
) {
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(el, key, { configurable: true, value });
  }
}

function viewportEl(container: HTMLElement = document.body): HTMLElement {
  return container.querySelector(
    '[data-slot="scroll-area-viewport"]',
  ) as HTMLElement;
}

function trackEl(container: HTMLElement = document.body): HTMLElement {
  return container.querySelector(
    '[data-slot="scroll-area-scrollbar"]',
  ) as HTMLElement;
}

/** 捕获 ResizeObserver 观察到的目标，便于手动触发回调 */
function installResizeObserver() {
  const targets: Element[] = [];
  const callbacks: Array<() => void> = [];
  class TestResizeObserver {
    constructor(cb: () => void) {
      callbacks.push(cb);
    }
    observe(target: Element) {
      targets.push(target);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  return { targets, callbacks };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ScrollArea - 渲染与 ARIA", () => {
  it("根元素带 data-slot 与 relative 定位", () => {
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));

    expect(container.querySelector('[data-slot="scroll-area"]')).toHaveClass(
      "relative",
    );
  });

  it("视口是 role=region 且应用自定义 aria-label", () => {
    const { container } = render(() => (
      <ScrollArea aria-label="消息列表">
        <div>内容</div>
      </ScrollArea>
    ));

    const viewport = viewportEl(container);
    expect(viewport).toHaveAttribute("role", "region");
    expect(viewport).toHaveAttribute("aria-label", "消息列表");
  });

  it("未传 aria-label 时使用默认英文文案", () => {
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));

    expect(viewportEl(container)).toHaveAttribute(
      "aria-label",
      "Scrollable content",
    );
  });

  it("默认（未指定 orientation）两个方向都可滚动", () => {
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));

    expect(viewportEl(container).className).toContain("overflow-scroll");
  });

  it("orientation=vertical 只允许纵向滚动", () => {
    const { container } = render(() => (
      <ScrollArea orientation="vertical">
        <div>内容</div>
      </ScrollArea>
    ));

    const viewport = viewportEl(container);
    expect(viewport.className).toContain("overflow-y-scroll");
    expect(viewport.className).toContain("overflow-x-hidden");
  });

  it("orientation=horizontal 只允许横向滚动", () => {
    const { container } = render(() => (
      <ScrollArea orientation="horizontal">
        <div>内容</div>
      </ScrollArea>
    ));

    const viewport = viewportEl(container);
    expect(viewport.className).toContain("overflow-x-scroll");
    expect(viewport.className).toContain("overflow-y-hidden");
  });

  it("子节点渲染在视口内部", () => {
    const { container } = render(() => (
      <ScrollArea>
        <p data-testid="child">内容</p>
      </ScrollArea>
    ));

    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
    expect(viewportEl(container).contains(child)).toBe(true);
  });

  it("class 与 classList 合并到根元素并透传其他属性", () => {
    const { container } = render(() => (
      <ScrollArea
        class="my-area"
        classList={{ extra: true }}
        data-testid="probe"
      >
        <div>内容</div>
      </ScrollArea>
    ));

    const root = container.querySelector(
      '[data-testid="probe"]',
    ) as HTMLElement;
    expect(root).toHaveClass("my-area");
    expect(root).toHaveClass("extra");
  });

  it("自动挂载一个 ScrollBar 子组件", () => {
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));

    const track = trackEl(container);
    expect(track).not.toBeNull();
    expect(track).toHaveAttribute("role", "scrollbar");
  });
});

describe("ScrollArea - 指标计算与更新", () => {
  it("滚动后重算 aria-valuenow 并刷新滑块样式", () => {
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));
    const viewport = viewportEl(container);
    setMetrics(viewport, {
      clientHeight: 400,
      scrollHeight: 1000,
      clientWidth: 400,
      scrollWidth: 400,
    });

    viewport.scrollTop = 300;
    fireEvent.scroll(viewport);

    const thumb = container.querySelector(
      '[data-slot="scroll-area-thumb"]',
    ) as HTMLElement;
    // thumbOffset = 300 / 600 = 0.5 → aria-valuenow 50
    expect(trackEl(container)).toHaveAttribute("aria-valuenow", "50");
    // track 尺寸为 0（jsdom 无布局）→ 滑块被夹到最小长度 20px
    expect(thumb.style.height).toBe("20px");
  });

  it("ResizeObserver 观察视口及其第一个子元素", () => {
    const { targets } = installResizeObserver();
    const { container } = render(() => (
      <ScrollArea>
        <div data-testid="content">内容</div>
      </ScrollArea>
    ));

    expect(targets).toContain(viewportEl(container));
    expect(targets).toContain(
      container.querySelector('[data-testid="content"]'),
    );
  });

  it("ResizeObserver 回调触发指标刷新", () => {
    const { callbacks } = installResizeObserver();
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));
    const viewport = viewportEl(container);
    setMetrics(viewport, {
      clientHeight: 100,
      scrollHeight: 500,
      clientWidth: 100,
      scrollWidth: 100,
    });
    viewport.scrollTop = 400;

    for (const cb of callbacks) cb();

    // thumbOffset = 400 / 400 = 1 → aria-valuenow 100
    expect(trackEl(container)).toHaveAttribute("aria-valuenow", "100");
  });

  it("无子元素时只观察视口本身", () => {
    const { targets } = installResizeObserver();
    render(() => <ScrollArea aria-label="空" />);

    expect(targets).toHaveLength(1);
    expect((targets[0] as HTMLElement).dataset.slot).toBe(
      "scroll-area-viewport",
    );
  });

  it("卸载后断开 ResizeObserver 并移除 scroll 监听", () => {
    const disconnect = vi.fn();
    class TestResizeObserver {
      observe() {}
      unobserve() {}
      disconnect = disconnect;
    }
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    const removeEventListener = vi.spyOn(
      HTMLElement.prototype,
      "removeEventListener",
    );

    const { unmount, container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));
    const viewport = viewportEl(container);

    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.anything(),
    );
    expect(viewport.isConnected).toBe(false);
    removeEventListener.mockRestore();
  });
});

describe("ScrollArea - 悬停状态", () => {
  it("mouseenter 设置 data-hovering、mouseleave 清除", () => {
    const { container } = render(() => (
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>
    ));
    const root = container.querySelector(
      '[data-slot="scroll-area"]',
    ) as HTMLElement;
    const track = trackEl(container);

    fireEvent.mouseEnter(root);
    expect(track).toHaveAttribute("data-hovering", "");

    fireEvent.mouseLeave(root);
    expect(track).not.toHaveAttribute("data-hovering");
  });
});

describe("ScrollArea - Context 约束", () => {
  it("ScrollBar 脱离 ScrollArea 使用时报错", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Probe = () => {
      useScrollAreaContext();
      return <div />;
    };

    expect(() => render(() => <Probe />)).toThrow(
      "useScrollAreaContext 必须用在 <ScrollArea> 内部",
    );

    spy.mockRestore();
  });

  it("在 ScrollArea 内可以取到 Context 且视口引用可用", () => {
    let ctx: ReturnType<typeof useScrollAreaContext> | undefined;
    const Probe = () => {
      ctx = useScrollAreaContext();
      return <div />;
    };

    const { container } = render(() => (
      <ScrollArea>
        <Probe />
      </ScrollArea>
    ));

    expect(ctx).toBeDefined();
    expect(ctx?.viewportRef()).toBe(viewportEl(container));
  });
});

describe("ScrollBar 公开导出", () => {
  it("ScrollBar 是可渲染的组件", () => {
    expect(typeof ScrollBar).toBe("function");
  });
});

describe("computeMetrics", () => {
  it("不可滚动时返回单位比例与零偏移", () => {
    expect(computeMetrics(100, 0, 100)).toEqual({
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    });
  });

  it("滚动内容仅超出 1px（容差内）视为不可滚动", () => {
    expect(computeMetrics(100, 0, 101)).toEqual({
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    });
  });

  it("可滚动时按比例给出 thumbRatio 与 thumbOffset", () => {
    expect(computeMetrics(400, 300, 1000)).toEqual({
      thumbRatio: 0.4,
      thumbOffset: 0.5,
      scrollable: true,
    });
  });

  it("滚动到末尾 thumbOffset 为 1", () => {
    expect(computeMetrics(400, 600, 1000)).toEqual({
      thumbRatio: 0.4,
      thumbOffset: 1,
      scrollable: true,
    });
  });

  it("视口尺寸为 0（内容溢出）时 thumbRatio 为 0 而不是 NaN", () => {
    expect(computeMetrics(0, 0, 5)).toEqual({
      thumbRatio: 0,
      thumbOffset: 0,
      scrollable: true,
    });
  });

  it("恰好超出 2px 即视为可滚动（越过 1px 容差）", () => {
    expect(computeMetrics(100, 1, 102)).toEqual({
      thumbRatio: 100 / 102,
      thumbOffset: 0.5,
      scrollable: true,
    });
  });
});
