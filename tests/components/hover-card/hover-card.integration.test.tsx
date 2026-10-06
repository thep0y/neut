import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HoverCard } from "~/components/hover-card/HoverCard/HoverCard";
import { HoverCardContent } from "~/components/hover-card/HoverCardContent/HoverCardContent";
import { HoverCardTrigger } from "~/components/hover-card/HoverCardTrigger/HoverCardTrigger";

/**
 * HoverCard 的开关时序测试。
 *
 * 与 Tooltip 的关键差异：
 * - 默认延时更长（open 700ms / close 300ms），因为 hover-card 是"主动探索"型信息；
 * - 延时可由根组件或 trigger 覆盖，**trigger 优先**；
 * - focus 同样跳过延时（键盘可达），mousedown 后的自动 focus 被忽略；
 * - hover-card **没有** TooltipGroup 式的组内抢占。
 */
function renderCard(
  props: {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    delay?: number;
    closeDelay?: number;
    triggerProps?: Record<string, unknown>;
  } = {},
) {
  return render(() => (
    <HoverCard
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
      delay={props.delay}
      closeDelay={props.closeDelay}
    >
      <HoverCardTrigger {...props.triggerProps}>悬停我</HoverCardTrigger>
      <HoverCardContent>卡片内容</HoverCardContent>
    </HoverCard>
  ));
}

function trigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="hover-card-trigger"]',
  ) as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

/**
 * jsdom 没有布局引擎：`getBoundingClientRect()` 恒为 0、`documentElement.clientWidth`
 * 恒为 0。HoverCardContent 的可见性由 `hide()` 中间件决定——参照矩形完全落在
 * 视口边界外（0 宽的边界把任何矩形都判成"在边界外"）时 `referenceHidden` 为 true，
 * 组件会走退场兜底把浮层卸载，"下一帧切 data-state=open"这条真实分支因此走不到。
 * 按 TESTING.md §8「布局相关」的做法显式 stub 这两个布局量（只 stub 系统边界）。
 */
function stubViewport(width = 1024, height = 768) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: height,
  });
}

function restoreViewport() {
  delete (document.documentElement as unknown as Record<string, unknown>)
    .clientWidth;
  delete (document.documentElement as unknown as Record<string, unknown>)
    .clientHeight;
}

/** 让参照元素报告一个视口内的矩形（message-scroller 的 stubRect 宽度为 0，会仍被判隐藏） */
function stubTriggerRect(el: Element) {
  el.getBoundingClientRect = () =>
    ({
      top: 100,
      bottom: 120,
      left: 100,
      right: 150,
      width: 50,
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
  restoreViewport();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("HoverCard - 初始状态与 ARIA", () => {
  it("默认关闭：不渲染内容", () => {
    renderCard();

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("关闭时 trigger 没有 aria-describedby", () => {
    renderCard();

    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("defaultOpen 时初始打开并建立关联", () => {
    renderCard({ defaultOpen: true });

    expect(content()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(trigger()).toHaveAttribute("data-popup-open", "");
    expect(trigger()).toHaveAttribute("aria-describedby", content()!.id);
  });

  it("默认渲染 <a> 标签", () => {
    renderCard();

    expect(trigger().tagName).toBe("A");
  });

  it("可以用 component 换成其它标签", () => {
    render(() => (
      <HoverCard>
        <HoverCardTrigger component="span">悬停我</HoverCardTrigger>
        <HoverCardContent>内容</HoverCardContent>
      </HoverCard>
    ));

    expect(trigger().tagName).toBe("SPAN");
  });
});

describe("HoverCard - 延时开关", () => {
  it("默认 700ms 后才打开", async () => {
    renderCard();

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(500);
    expect(content()).toBeNull();

    await vi.advanceTimersByTimeAsync(250);
    expect(content()).toBeInTheDocument();
  });

  it("根组件的 delay 覆盖默认值", async () => {
    renderCard({ delay: 100 });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(150);

    expect(content()).toBeInTheDocument();
  });

  it("trigger 的 delay 优先于根组件", async () => {
    renderCard({ delay: 1000, triggerProps: { delay: 50 } });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(100);

    expect(content()).toBeInTheDocument();
  });

  it("延时内离开会取消打开", async () => {
    renderCard({ delay: 500 });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(200);
    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(800);

    expect(content()).toBeNull();
  });

  it("离开后按默认 300ms 关闭", async () => {
    renderCard({ defaultOpen: true });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(150);
    expect(trigger()).toHaveAttribute("data-state", "open");

    await vi.advanceTimersByTimeAsync(200);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("trigger 的 closeDelay 优先于根组件", async () => {
    renderCard({
      defaultOpen: true,
      closeDelay: 1000,
      triggerProps: { closeDelay: 50 },
    });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(100);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("disabled 时 hover 不打开", async () => {
    renderCard({ disabled: true });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(1000);

    expect(content()).toBeNull();
  });

  it("trigger 自身 disabled 时也不打开", async () => {
    renderCard({ triggerProps: { disabled: true } });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(1000);

    expect(content()).toBeNull();
  });

  it("已打开时再次 pointerenter 不重复排程、不重复回调", async () => {
    const onOpenChange = vi.fn();
    renderCard({ defaultOpen: true, onOpenChange });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(1000);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute("data-state", "open");
  });
});

describe("HoverCard - 键盘与焦点（跳过延时）", () => {
  it("focus 立即打开，不等 delay", async () => {
    renderCard({ delay: 5000 });

    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("blur 立即关闭，不等 closeDelay", async () => {
    renderCard({ defaultOpen: true, closeDelay: 5000 });

    fireEvent.blur(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("Escape 立即关闭并阻止冒泡", async () => {
    renderCard({ defaultOpen: true, closeDelay: 5000 });
    const outer = vi.fn();
    document.addEventListener("keydown", outer);

    fireEvent.keyDown(trigger(), { key: "Escape" });
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
    expect(outer).not.toHaveBeenCalled();
    document.removeEventListener("keydown", outer);
  });

  it("未打开时 Escape 不做任何事", async () => {
    const onOpenChange = vi.fn();
    renderCard({ onOpenChange });

    fireEvent.keyDown(trigger(), { key: "Escape" });
    await vi.advanceTimersByTimeAsync(0);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disabled 时 focus 不打开", async () => {
    renderCard({ disabled: true });

    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("mousedown 后的自动 focus 不会打开卡片", async () => {
    renderCard();

    fireEvent.mouseDown(trigger());
    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(1000);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("mouseup 之后的键盘 focus 仍会打开", async () => {
    renderCard();

    fireEvent.mouseDown(trigger());
    fireEvent.mouseUp(document);
    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("mousedown 本身不关闭已打开的卡片（与 Tooltip 不同）", async () => {
    renderCard({ defaultOpen: true });

    fireEvent.mouseDown(trigger());
    await vi.advanceTimersByTimeAsync(0);

    // HoverCard 的 mousedown 只设标记，不主动关闭
    expect(trigger()).toHaveAttribute("data-state", "open");
  });
});

describe("HoverCard - 内容可交互（keepOpen）", () => {
  it("鼠标移入内容会取消待关闭计时", async () => {
    stubViewport();
    render(() => (
      <HoverCard defaultOpen>
        <HoverCardTrigger ref={stubTriggerRect}>悬停我</HoverCardTrigger>
        <HoverCardContent>卡片内容</HoverCardContent>
      </HoverCard>
    ));
    const surface = content()!;

    // 移出 trigger：按默认 300ms 排入关闭计时
    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(100);
    // 还没到 300ms，此时移入内容 → keepOpen 取消关闭
    fireEvent.mouseEnter(surface);
    await vi.advanceTimersByTimeAsync(1000);

    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(content()).toBe(surface);
  });

  it("鼠标移出内容后按 closeDelay 关闭", async () => {
    renderCard({ defaultOpen: true, closeDelay: 50 });
    const surface = content()!;

    fireEvent.mouseLeave(surface);
    await vi.advanceTimersByTimeAsync(100);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("没有待关闭计时时移入内容不受影响", async () => {
    stubViewport();
    render(() => (
      <HoverCard defaultOpen>
        <HoverCardTrigger ref={stubTriggerRect}>悬停我</HoverCardTrigger>
        <HoverCardContent>卡片内容</HoverCardContent>
      </HoverCard>
    ));
    const surface = content()!;

    fireEvent.mouseEnter(surface);
    await vi.advanceTimersByTimeAsync(500);

    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(content()).toBe(surface);
  });

  it("通过 style 传入对象时合并到浮层", () => {
    render(() => (
      <HoverCard defaultOpen>
        <HoverCardTrigger>悬停我</HoverCardTrigger>
        <HoverCardContent style={{ color: "red" }}>卡片内容</HoverCardContent>
      </HoverCard>
    ));

    expect(content()!.style.color).toBe("red");
  });
});

describe("HoverCard - 退场动画", () => {
  it("打开后下一帧把 data-state 切到 open（等 placement 算好）", async () => {
    stubViewport();
    // rAF 不被 vitest 的假计时器接管，这里用真实帧驱动
    vi.useRealTimers();
    render(() => (
      <HoverCard defaultOpen>
        <HoverCardTrigger ref={stubTriggerRect}>悬停我</HoverCardTrigger>
        <HoverCardContent>卡片内容</HoverCardContent>
      </HoverCard>
    ));
    const surface = content()!;

    expect(surface).toHaveAttribute("data-state", "closed");
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(surface).toHaveAttribute("data-state", "open");
  });

  it("关闭后只有 content 自身的 animationend 才卸载，子元素冒泡的不算", async () => {
    render(() => (
      <HoverCard defaultOpen closeDelay={50}>
        <HoverCardTrigger>悬停我</HoverCardTrigger>
        <HoverCardContent>
          <span data-testid="inner">卡片内容</span>
        </HoverCardContent>
      </HoverCard>
    ));
    const surface = content()!;

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(100);
    // 仍在挂载，等待退场动画
    expect(content()).toBe(surface);

    // 子元素冒泡上来的 animationend：target 不是 content 自身，应被忽略
    fireEvent.animationEnd(document.querySelector('[data-testid="inner"]')!);
    expect(content()).toBe(surface);

    fireEvent.animationEnd(surface);
    expect(content()).toBeNull();
  });
});

describe("HoverCard - 受控模式与用户事件", () => {
  it("受控 open=false 时 hover 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderCard({ open: false, onOpenChange });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(1000);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("受控 open=true 时 blur 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderCard({ open: true, onOpenChange });

    fireEvent.blur(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("用户自己的 onClick 不会被内部监听覆盖", () => {
    const onClick = vi.fn();
    renderCard({ triggerProps: { onClick } });

    fireEvent.click(trigger());

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
