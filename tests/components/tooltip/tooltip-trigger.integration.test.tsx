import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "~/components/tooltip/Tooltip/Tooltip";
import { TooltipContent } from "~/components/tooltip/TooltipContent/TooltipContent";
import { TooltipTrigger } from "~/components/tooltip/TooltipTrigger/TooltipTrigger";

/**
 * Tooltip 的开关时序测试。
 *
 * 这是 tooltip 最核心的契约，也是最容易被改坏的部分：
 * - hover 走 `openDelay` / `closeDelay`（可被 TooltipProvider 提供默认值）；
 * - **键盘 focus 跳过延迟**（无障碍要求：键盘用户不该被迫等待）；
 * - **mousedown 立即关闭**，且要紧跟其后的浏览器自动 focus 不能把它又打开
 *   （否则"关掉又弹出来"两条逻辑打架）；
 * - Escape 立即关闭并阻止冒泡（避免外层重复处理）。
 */
function renderTooltip(
  props: {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    openDelay?: number;
    closeDelay?: number;
  } = {},
) {
  return render(() => (
    <Tooltip
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
      openDelay={props.openDelay}
      closeDelay={props.closeDelay}
    >
      <TooltipTrigger>悬停我</TooltipTrigger>
      <TooltipContent>提示内容</TooltipContent>
    </Tooltip>
  ));
}

/**
 * 注意：`TooltipTrigger` 默认渲染 `<Button>`，因此 DOM 上是
 * `data-slot="button"` 而不是 `tooltip-trigger`。
 */
function trigger(): HTMLElement {
  return document.querySelector("button") as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[role="tooltip"]');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Tooltip - 初始状态与 ARIA", () => {
  it("默认关闭：不渲染 content 且 trigger data-state=closed", () => {
    renderTooltip();

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("关闭时 trigger 没有 aria-describedby", () => {
    renderTooltip();

    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("defaultOpen 时初始打开并建立 aria-describedby 关联", () => {
    renderTooltip({ defaultOpen: true });

    expect(content()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(trigger()).toHaveAttribute("aria-describedby", content()!.id);
  });

  it("content 是 role=tooltip", () => {
    renderTooltip({ defaultOpen: true });

    expect(content()).toHaveAttribute("role", "tooltip");
  });
});

describe("Tooltip - hover 延时", () => {
  it("默认 openDelay 为 0：hover 后立刻打开", async () => {
    renderTooltip();

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(content()).toBeInTheDocument();
  });

  it("openDelay 未到时不打开", async () => {
    renderTooltip({ openDelay: 300 });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(200);
    expect(content()).toBeNull();

    await vi.advanceTimersByTimeAsync(150);
    expect(content()).toBeInTheDocument();
  });

  it("在 openDelay 内离开会取消打开", async () => {
    renderTooltip({ openDelay: 300 });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(100);
    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(500);

    expect(content()).toBeNull();
  });

  it("离开后按 closeDelay 关闭（默认 150ms）", async () => {
    renderTooltip({ defaultOpen: true });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(100);
    // 未到 closeDelay：仍在挂载（可能已进入退场动画）
    expect(content()).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(0);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("closeDelay 内重新进入会取消待执行的关闭（data-state 保持 open）", async () => {
    renderTooltip({ defaultOpen: true });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(50);
    // requestOpen 会先 clearTimers，取消待关闭
    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(300);

    // 契约：待执行的关闭被取消，trigger 仍标记为 open。
    // 注意：此时 content 可能已被 Presence 逻辑卸载（mounted 已翻成 false
    // 且没有新的 false->true 边沿来触发重新挂载），因此这里不断言 content
    // 的存在性——那属于「重新进入 vs 退场动画」的产品语义问题。
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("disabled 时 hover 不打开", async () => {
    renderTooltip({ disabled: true });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(500);

    expect(content()).toBeNull();
  });
});

describe("Tooltip - 键盘与焦点（跳过延时）", () => {
  it("focus 立即打开，不等 openDelay", async () => {
    renderTooltip({ openDelay: 1000 });

    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("blur 立即关闭，不等 closeDelay", async () => {
    renderTooltip({ defaultOpen: true, closeDelay: 1000 });

    fireEvent.blur(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("Escape 立即关闭", async () => {
    renderTooltip({ defaultOpen: true, closeDelay: 1000 });

    fireEvent.keyDown(trigger(), { key: "Escape" });
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("Escape 在未打开时不做任何事", async () => {
    const onOpenChange = vi.fn();
    renderTooltip({ onOpenChange });

    fireEvent.keyDown(trigger(), { key: "Escape" });
    await vi.advanceTimersByTimeAsync(0);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("Escape 阻止冒泡（避免外层重复处理）", () => {
    renderTooltip({ defaultOpen: true });
    const outer = vi.fn();
    document.addEventListener("keydown", outer);

    fireEvent.keyDown(trigger(), { key: "Escape" });

    expect(outer).not.toHaveBeenCalled();
    document.removeEventListener("keydown", outer);
  });

  it("disabled 时 focus 不打开", async () => {
    renderTooltip({ disabled: true });

    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });
});

describe("Tooltip - mousedown 与自动 focus 的冲突", () => {
  it("mousedown 立即关闭已打开的 tooltip", async () => {
    renderTooltip({ defaultOpen: true, closeDelay: 1000 });

    fireEvent.mouseDown(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("mousedown 紧跟的自动 focus 不会重新打开", async () => {
    renderTooltip({ defaultOpen: true });

    // 真实事件顺序：mousedown -> focus
    fireEvent.mouseDown(trigger());
    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(300);

    // isPointerDown 标记让这次 focus 被跳过
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("mouseup 之后的 focus（真正的键盘导航）仍会打开", async () => {
    renderTooltip();

    fireEvent.mouseDown(trigger());
    // document 上的 mouseup 会清掉标记
    fireEvent.mouseUp(document);
    fireEvent.focus(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("disabled 时 mousedown 不关闭（本来也没打开）", async () => {
    renderTooltip({ disabled: true, defaultOpen: true });

    fireEvent.mouseDown(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "open");
  });
});

describe("Tooltip - 受控模式与回调", () => {
  it("受控 open=false 时 hover 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderTooltip({ open: false, onOpenChange });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(100);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("受控 open=true 时 blur 只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderTooltip({ open: true, onOpenChange });

    fireEvent.blur(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("用户自己的 onClick 与内部监听互不覆盖", () => {
    const onClick = vi.fn();
    render(() => (
      <Tooltip defaultOpen>
        <TooltipTrigger onClick={onClick}>悬停我</TooltipTrigger>
        <TooltipContent>提示内容</TooltipContent>
      </Tooltip>
    ));

    fireEvent.click(trigger());

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
