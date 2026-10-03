import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "~/components/tooltip/Tooltip/Tooltip";
import { TooltipContent } from "~/components/tooltip/TooltipContent/TooltipContent";
import { TooltipProvider } from "~/components/tooltip/TooltipProvider/TooltipProvider";
import { TooltipTrigger } from "~/components/tooltip/TooltipTrigger/TooltipTrigger";

/**
 * TooltipProvider 的契约：为组内所有 tooltip 提供默认的 `delay` / `closeDelay`，
 * 单条 tooltip 自己的同名 prop 优先。
 *
 * 断言都落在使用者可见的行为上：浮层是否已经出现、触发器 `data-state` 是否翻转。
 */
function renderWithProvider(props: {
  provider?: { delay?: number; closeDelay?: number };
  tooltip?: { openDelay?: number; closeDelay?: number; defaultOpen?: boolean };
}) {
  return render(() => (
    <TooltipProvider
      delay={props.provider?.delay}
      closeDelay={props.provider?.closeDelay}
    >
      <Tooltip
        openDelay={props.tooltip?.openDelay}
        closeDelay={props.tooltip?.closeDelay}
        defaultOpen={props.tooltip?.defaultOpen}
      >
        <TooltipTrigger>悬停我</TooltipTrigger>
        <TooltipContent>提示内容</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ));
}

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

describe("TooltipProvider - 打开延时", () => {
  it("不传 delay 时默认 0：hover 后立即打开", async () => {
    renderWithProvider({});

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(content()).toBeInTheDocument();
  });

  it("provider 的 delay 作用于组内 tooltip（未到延时不会打开）", async () => {
    renderWithProvider({ provider: { delay: 200 } });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(100);
    expect(content()).toBeNull();

    await vi.advanceTimersByTimeAsync(150);
    expect(content()).toBeInTheDocument();
  });

  it("tooltip 自己的 openDelay 优先于 provider.delay", async () => {
    renderWithProvider({
      provider: { delay: 1000 },
      tooltip: { openDelay: 0 },
    });

    fireEvent.pointerEnter(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(content()).toBeInTheDocument();
  });
});

describe("TooltipProvider - 关闭延时", () => {
  it("不传 closeDelay 时默认 150：移出后按 150ms 关闭", async () => {
    renderWithProvider({ tooltip: { defaultOpen: true } });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(100);
    expect(trigger()).toHaveAttribute("data-state", "open");

    await vi.advanceTimersByTimeAsync(60);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("provider 的 closeDelay 作用于组内 tooltip", async () => {
    renderWithProvider({
      provider: { closeDelay: 500 },
      tooltip: { defaultOpen: true },
    });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(200);
    expect(trigger()).toHaveAttribute("data-state", "open");

    await vi.advanceTimersByTimeAsync(400);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("tooltip 自己的 closeDelay 优先于 provider.closeDelay", async () => {
    renderWithProvider({
      provider: { closeDelay: 1000 },
      tooltip: { defaultOpen: true, closeDelay: 0 },
    });

    fireEvent.pointerLeave(trigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(trigger()).toHaveAttribute("data-state", "closed");
  });
});
