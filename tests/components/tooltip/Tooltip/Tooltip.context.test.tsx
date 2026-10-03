import { render, renderHook } from "@solidjs/testing-library";
import { onMount } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "~/components/tooltip/Tooltip/Tooltip";
import { useTooltipContext } from "~/components/tooltip/Tooltip/Tooltip.context";
import type { TooltipContextValue } from "~/components/tooltip/Tooltip/Tooltip.types";
import { TooltipContent } from "~/components/tooltip/TooltipContent/TooltipContent";
import { TooltipTrigger } from "~/components/tooltip/TooltipTrigger/TooltipTrigger";

/**
 * Tooltip 根组件的 context 契约。
 *
 * 这里覆盖两条从 trigger/content 的公开交互走不到、但 context 明确承诺过的行为：
 * - 脱离 <Tooltip> 使用 useTooltipContext 时抛中文错误；
 * - `openImmediate` 在 disabled 时是空操作（trigger 的 onFocus 已经先挡了一层，
 *   所以这条守卫只能从 context 直接验证）。
 */
function Probe(props: { onReady: (ctx: TooltipContextValue) => void }) {
  const ctx = useTooltipContext("Probe");
  onMount(() => props.onReady(ctx));
  return null;
}

async function renderConsumer(
  tooltipProps: { disabled?: boolean; defaultOpen?: boolean } = {},
  onOpenChange = vi.fn(),
) {
  let ctx: TooltipContextValue | undefined;
  const result = render(() => (
    <Tooltip
      disabled={tooltipProps.disabled}
      defaultOpen={tooltipProps.defaultOpen}
      onOpenChange={onOpenChange}
    >
      <TooltipTrigger>悬停我</TooltipTrigger>
      <TooltipContent>提示内容</TooltipContent>
      <Probe onReady={(value) => (ctx = value)} />
    </Tooltip>
  ));
  await Promise.resolve();
  return { ...result, ctx: ctx!, onOpenChange };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("useTooltipContext", () => {
  it("脱离 <Tooltip> 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useTooltipContext("TooltipContent"))).toThrow(
      "<TooltipContent> 必须渲染在 <Tooltip> 内部",
    );

    spy.mockRestore();
  });
});

describe("Tooltip context - openImmediate", () => {
  it("disabled 时 openImmediate 是空操作，不回调也不打开", async () => {
    const { ctx, onOpenChange } = await renderConsumer({ disabled: true });

    ctx.openImmediate();

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("未禁用时 openImmediate 跳过 openDelay 立即打开", async () => {
    const { ctx, onOpenChange } = await renderConsumer({});

    ctx.openImmediate();

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.querySelector('[role="tooltip"]')).toBeInTheDocument();
  });
});
