import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "~/components/tooltip/Tooltip/Tooltip";
import { TooltipArrow } from "~/components/tooltip/TooltipArrow/TooltipArrow";
import { TooltipContent } from "~/components/tooltip/TooltipContent/TooltipContent";
import {
  TooltipContentContext,
  type TooltipContentContextValue,
} from "~/components/tooltip/TooltipContent/TooltipContent.context";
import { TooltipTrigger } from "~/components/tooltip/TooltipTrigger/TooltipTrigger";
import type { Placement } from "~/lib";

/**
 * TooltipArrow 是纯装饰（aria-hidden）元素，但它的 data-side / data-align /
 * --arrow-offset 决定箭头贴在 trigger 的哪条边、对齐位置在哪，属于可见行为。
 *
 * 方向与偏移都由 TooltipContent 的 context 提供，因此这里既用真实 Tooltip 走一遍，
 * 也直接构造 context 覆盖"读不到 reference"这类 jsdom 下不好构造的分支。
 */
function renderArrow(
  options: { placement?: Placement; reference?: Element; class?: string } = {},
) {
  const setArrowElement = vi.fn();
  const value: TooltipContentContextValue = {
    middlewareData: () => ({}),
    reference: () => options.reference,
    placement: () => options.placement ?? "top",
    setArrowElement,
    animationState: () => "open",
  };

  const result = render(() => (
    <TooltipContentContext.Provider value={value}>
      <TooltipArrow class={options.class} />
    </TooltipContentContext.Provider>
  ));

  return { ...result, setArrowElement };
}

function arrowFrom(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('[aria-hidden="true"]')!;
}

function stubWidth(el: HTMLElement, width: number): void {
  el.getBoundingClientRect = () =>
    ({
      top: 100,
      left: 100,
      right: 100 + width,
      bottom: 120,
      width,
      height: 20,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("TooltipArrow - context 驱动的方向与偏移", () => {
  it("居中摆放时 data-align 回退为 center，读不到 reference 时偏移为 0", () => {
    const { container } = renderArrow({ placement: "left" });
    const arrow = arrowFrom(container);

    expect(arrow).toHaveAttribute("data-side", "left");
    expect(arrow).toHaveAttribute("data-align", "center");
    expect(arrow.style.getPropertyValue("--arrow-offset")).toBe("0px");
  });

  it("对齐方式从 placement 拆出，偏移取 trigger 宽度的一半", () => {
    const reference = document.createElement("div");
    stubWidth(reference, 60);
    const { container } = renderArrow({ placement: "top-start", reference });

    const arrow = arrowFrom(container);
    expect(arrow).toHaveAttribute("data-side", "top");
    expect(arrow).toHaveAttribute("data-align", "start");
    expect(arrow.style.getPropertyValue("--arrow-offset")).toBe("30px");
  });

  it("把自己注册给 arrow middleware，并透传 class", () => {
    const { container, setArrowElement } = renderArrow({ class: "my-arrow" });
    const arrow = arrowFrom(container);

    expect(setArrowElement.mock.calls[0]?.[0]).toBe(arrow);
    expect(arrow.className).toContain("my-arrow");
  });
});

describe("TooltipArrow - 上下文约束", () => {
  it("脱离 <TooltipContent> 渲染时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <TooltipArrow />)).toThrow(
      "<TooltipArrow> 必须渲染在 <TooltipContent> 内部",
    );

    spy.mockRestore();
  });
});

describe("TooltipArrow - 真实浮层中的装配", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("箭头渲染在 content 内部，方向与含箭头后的 placement 一致", async () => {
    render(() => (
      <Tooltip>
        <TooltipTrigger>悬停我</TooltipTrigger>
        <TooltipContent side="top">
          提示内容
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    ));
    stubWidth(document.querySelector("button")!, 60);

    fireEvent.pointerEnter(document.querySelector("button")!);
    await vi.advanceTimersByTimeAsync(0);

    const content = document.querySelector('[role="tooltip"]')!;
    const arrow = content.querySelector<HTMLElement>('[aria-hidden="true"]')!;
    expect(content.contains(arrow)).toBe(true);
    expect(arrow.style.getPropertyValue("--arrow-offset")).toBe("30px");
    expect(arrow).toHaveAttribute("data-side", "top");
  });
});
