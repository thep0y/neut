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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
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
