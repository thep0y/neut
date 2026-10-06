import { render, renderHook } from "@solidjs/testing-library";
import { onMount } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HoverCard } from "~/components/hover-card/HoverCard/HoverCard";
import { HoverCardContent } from "~/components/hover-card/HoverCardContent/HoverCardContent";
import { HoverCardTrigger } from "~/components/hover-card/HoverCardTrigger/HoverCardTrigger";
import { useHoverCardContext } from "~/components/hover-card/hover-card.context";
import type { HoverCardContextValue } from "~/components/hover-card/hover-card.types";

/**
 * HoverCard 根组件的 context 契约。
 *
 * 这里覆盖两条从 trigger/content 的公开交互走不到、但 context 明确承诺过的行为
 * （与 Tooltip 的同名文件对应）：
 * - 脱离 <HoverCard> 使用 useHoverCardContext 时抛中文错误；
 * - `openImmediate` 在 disabled 时是空操作（trigger 的 onFocus 已经先挡了一层，
 *   所以这条守卫只能从 context 直接验证）。
 */
function Probe(props: { onReady: (ctx: HoverCardContextValue) => void }) {
  const ctx = useHoverCardContext("Probe");
  onMount(() => props.onReady(ctx));
  return null;
}

async function renderConsumer(
  hoverCardProps: { disabled?: boolean; defaultOpen?: boolean } = {},
  onOpenChange = vi.fn(),
) {
  let ctx: HoverCardContextValue | undefined;
  const result = render(() => (
    <HoverCard
      disabled={hoverCardProps.disabled}
      defaultOpen={hoverCardProps.defaultOpen}
      onOpenChange={onOpenChange}
    >
      <HoverCardTrigger>悬停我</HoverCardTrigger>
      <HoverCardContent>卡片内容</HoverCardContent>
      <Probe onReady={(value) => (ctx = value)} />
    </HoverCard>
  ));
  await Promise.resolve();
  return { ...result, ctx: ctx!, onOpenChange };
}

function trigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="hover-card-trigger"]',
  ) as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("useHoverCardContext", () => {
  it("脱离 <HoverCard> 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useHoverCardContext("HoverCardContent")),
    ).toThrow("<HoverCardContent> 必须渲染在 <HoverCard> 内部");

    spy.mockRestore();
  });
});

describe("HoverCard context - openImmediate", () => {
  it("disabled 时 openImmediate 是空操作，不回调也不打开", async () => {
    const { ctx, onOpenChange } = await renderConsumer({ disabled: true });

    ctx.openImmediate();

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("未禁用时 openImmediate 跳过 delay 立即打开", async () => {
    const { ctx, onOpenChange } = await renderConsumer({});

    ctx.openImmediate();

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("data-state", "open");
  });
});
