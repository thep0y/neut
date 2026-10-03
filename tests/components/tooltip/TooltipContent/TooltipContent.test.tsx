import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "~/components/tooltip/Tooltip/Tooltip";
import { TooltipContent } from "~/components/tooltip/TooltipContent/TooltipContent";
import type { TooltipContentProps } from "~/components/tooltip/TooltipContent/TooltipContent.types";
import { TooltipTrigger } from "~/components/tooltip/TooltipTrigger/TooltipTrigger";

/**
 * TooltipContent 的展示契约：Portal 挂到 body、角色/可访问性、data-* 动画状态、
 * 以及"鼠标移进内容会取消待关闭"这条让用户能选中 tooltip 里文字的行为。
 */
function renderContent(
  props: Partial<TooltipContentProps> = {},
  tooltipProps: { defaultOpen?: boolean } = { defaultOpen: true },
) {
  return render(() => (
    <Tooltip defaultOpen={tooltipProps.defaultOpen}>
      <TooltipTrigger>悬停我</TooltipTrigger>
      <TooltipContent {...props}>提示内容</TooltipContent>
    </Tooltip>
  ));
}

function trigger(): HTMLElement {
  return document.querySelector("button") as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[role="tooltip"]');
}

/**
 * jsdom 不做布局：触发器矩形恒为 (0,0,0,0)、`documentElement.clientWidth/Height`
 * 恒为 0，hide 中间件会据此判定 reference 已被裁掉并把浮层标记为隐藏。
 * 要让"可见"这条路径真正成立，必须补一个视口内的矩形与视口尺寸
 * （TESTING.md §4.5：只 stub 系统边界）。
 */
function stubTriggerRect(): void {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: 768,
  });
  trigger().getBoundingClientRect = () =>
    ({
      top: 100,
      left: 100,
      right: 160,
      bottom: 120,
      width: 60,
      height: 20,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  Reflect.deleteProperty(document.documentElement, "clientWidth");
  Reflect.deleteProperty(document.documentElement, "clientHeight");
  vi.restoreAllMocks();
});

describe("TooltipContent - 渲染与 ARIA", () => {
  it("Portal 到 body，带 role=tooltip 与 id", () => {
    const { container } = renderContent();

    expect(content()).toBeInTheDocument();
    expect(container.contains(content())).toBe(false);
    expect(content()!.id).toMatch(/^tooltip-/);
  });

  it("透传 class、style 对象与任意原生属性", () => {
    renderContent({
      class: "my-tooltip",
      style: { color: "red" },
      // TooltipContent 明确把未摘出的原生属性原样透传给内层元素，
      // 因此这里可以传类型里没列举的 data-*。
      "data-x": "1",
    } as unknown as Partial<TooltipContentProps>);

    expect(content()!.className).toContain("my-tooltip");
    expect(content()!.style.color).toBe("red");
    // 未显式指定 transform-origin 时也总有一个（缩放动画的锚点）
    expect(content()!.style.transformOrigin).not.toBe("");
    expect(content()).toHaveAttribute("data-x", "1");
  });

  it("side / align 决定 data-side / data-align", () => {
    renderContent({ side: "bottom", align: "end" });

    expect(content()).toHaveAttribute("data-align", "end");
    // flip 中间件可能按视口空间调整 side，这里只要求是合法方向之一
    expect(["top", "bottom", "left", "right"]).toContain(
      content()!.getAttribute("data-side"),
    );
  });

  it("外层承担定位，data-placement 与 opacity 一同给出", () => {
    renderContent();

    const positioner = content()!.parentElement!.parentElement!;
    expect(positioner).toHaveAttribute("data-placement");
    expect(positioner.style.opacity).toBe("1");
  });
});

describe("TooltipContent - 进出场状态机", () => {
  it("冒头那一帧 data-state 仍是 closed，下一帧才切到 open", async () => {
    renderContent({}, { defaultOpen: false });
    stubTriggerRect();

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(content()).toHaveAttribute("data-state", "closed");

    await vi.advanceTimersByTimeAsync(16);

    expect(content()).toHaveAttribute("data-state", "open");
  });

  it("关闭时 data-state 立即变 closed（不等一帧）", async () => {
    renderContent({}, { defaultOpen: false });
    stubTriggerRect();

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(16);
    expect(content()).toHaveAttribute("data-state", "open");

    fireEvent.blur(trigger());

    expect(content()).toHaveAttribute("data-state", "closed");
  });
});

describe("TooltipContent - 内容上的鼠标行为", () => {
  it("鼠标移进内容取消待执行的关闭（让用户可以选中文字）", async () => {
    renderContent();

    fireEvent.pointerLeave(trigger());
    fireEvent.mouseEnter(content()!);
    await vi.advanceTimersByTimeAsync(500);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("没有待执行关闭时移入内容也保持打开", async () => {
    renderContent();

    fireEvent.mouseEnter(content()!);
    await vi.advanceTimersByTimeAsync(500);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("鼠标移出内容后按 closeDelay 关闭", async () => {
    renderContent({ side: "top" });

    fireEvent.mouseLeave(content()!);
    await vi.advanceTimersByTimeAsync(100);
    expect(trigger()).toHaveAttribute("data-state", "open");

    await vi.advanceTimersByTimeAsync(60);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });
});
