import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { MessageScrollerButton } from "~/components/message-scroller/MessageScrollerButton/MessageScrollerButton";
import type { MessageScrollerContextValue } from "~/components/message-scroller/message-scroller.types";
import {
  contextWrapper,
  fakeContext,
} from "~tests/components/message-scroller/test-utils";

/**
 * 滚动控件：`data-active` 由"该方向是否还能滚"决定；不可滚时 inert + 移出 tab 序列；
 * 点击会先失焦再发命令（避免焦点留在按钮上导致视口键盘滚动失效）。
 */
function renderButton(
  props: Parameters<typeof MessageScrollerButton>[0] = {},
  overrides: Parameters<typeof fakeContext>[0] = {},
) {
  return render(() => <MessageScrollerButton {...props} />, {
    wrapper: contextWrapper(fakeContext(overrides)),
  });
}

function buttonOf(container: HTMLElement): HTMLButtonElement | null {
  return container.querySelector('[data-slot="message-scroller-button"]');
}

describe("MessageScrollerButton - 结构与默认值", () => {
  it("默认渲染 button 元素", () => {
    const { container } = renderButton();

    expect(buttonOf(container)?.tagName).toBe("BUTTON");
    expect(buttonOf(container)?.getAttribute("type")).toBe("button");
  });

  it("默认 direction=end，并输出 variant / size 的 data 属性", () => {
    const { container } = renderButton();
    const element = buttonOf(container);

    expect(element?.getAttribute("data-direction")).toBe("end");
    expect(element?.getAttribute("data-variant")).toBe("secondary");
    expect(element?.getAttribute("data-size")).toBe("icon-sm");
  });

  it("variant / size / class / classList 可覆盖", () => {
    const { container } = renderButton({
      variant: "outline",
      size: "icon",
      class: "my-button",
      classList: { "is-floating": true },
    });
    const element = buttonOf(container);

    expect(element?.getAttribute("data-variant")).toBe("outline");
    expect(element?.getAttribute("data-size")).toBe("icon");
    expect(element?.className).toContain("my-button");
    expect(element?.className).toContain("is-floating");
  });

  it("未传 children 时渲染箭头图标 + sr-only 文案", () => {
    const { container } = renderButton();

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector(".sr-only")?.textContent).toBe(
      "Scroll to end",
    );
  });

  it("direction=start 时 sr-only 文案与 aria-label 指向起点", () => {
    const { container } = renderButton({ direction: "start" });

    expect(container.querySelector(".sr-only")?.textContent).toBe(
      "Scroll to start",
    );
    expect(buttonOf(container)?.getAttribute("aria-label")).toBe(
      "Scroll to start",
    );
  });

  it("传入 children 时替换默认内容", () => {
    const { container } = renderButton({
      children: <span data-testid="custom">Jump to latest</span>,
    });

    expect(container.querySelector('[data-testid="custom"]')).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("component 可指定渲染成别的元素（多态）", () => {
    const { container } = renderButton({ component: "div" } as never);

    expect(buttonOf(container)?.tagName).toBe("DIV");
  });
});

describe("MessageScrollerButton - active 与可访问性", () => {
  it("direction=end 时跟随 scrollableEnd", () => {
    const inactive = renderButton({}, { scrollableEnd: () => false });
    expect(buttonOf(inactive.container)?.getAttribute("data-active")).toBe(
      "false",
    );

    const active = renderButton({}, { scrollableEnd: () => true });
    expect(buttonOf(active.container)?.getAttribute("data-active")).toBe(
      "true",
    );
  });

  it("direction=start 时跟随 scrollableStart", () => {
    const { container } = renderButton(
      { direction: "start" },
      { scrollableStart: () => true, scrollableEnd: () => false },
    );

    expect(buttonOf(container)?.getAttribute("data-active")).toBe("true");
  });

  it("不可滚时 inert 且 tabIndex=-1", () => {
    const { container } = renderButton({}, { scrollableEnd: () => false });
    const element = buttonOf(container);

    expect(element?.inert).toBe(true);
    expect(element?.getAttribute("tabindex")).toBe("-1");
  });

  it("可滚时取消 inert，tabIndex 默认 0", () => {
    const { container } = renderButton({}, { scrollableEnd: () => true });
    const element = buttonOf(container);

    expect(element?.inert).toBe(false);
    expect(element?.getAttribute("tabindex")).toBe("0");
  });

  it("可滚时可用 tabIndex 自定义", () => {
    const { container } = renderButton(
      { tabIndex: 3 },
      { scrollableEnd: () => true },
    );

    expect(buttonOf(container)?.getAttribute("tabindex")).toBe("3");
  });

  it("可滚性变化时 inert / data-active / tabIndex 一起更新", () => {
    const [end, setEnd] = createSignal(false);
    const { container } = renderButton({}, { scrollableEnd: end });
    const element = buttonOf(container);
    expect(element?.inert).toBe(true);

    setEnd(true);

    expect(element?.inert).toBe(false);
    expect(element?.getAttribute("data-active")).toBe("true");
    expect(element?.getAttribute("tabindex")).toBe("0");
  });
});

describe("MessageScrollerButton - 点击行为", () => {
  it("direction=end 且可滚时先失焦再 scrollToEnd（默认 smooth）", () => {
    const scrollToEnd = vi.fn(() => true);
    const { container } = renderButton(
      {},
      { scrollableEnd: () => true, scrollToEnd },
    );
    const element = buttonOf(container)!;
    element.focus();
    expect(document.activeElement).toBe(element);

    element.click();

    expect(scrollToEnd).toHaveBeenCalledWith({ behavior: "smooth" });
    expect(document.activeElement).not.toBe(element);
  });

  it("direction=start 时调用 scrollToStart", () => {
    const scrollToStart = vi.fn(() => true);
    const { container } = renderButton(
      { direction: "start" },
      { scrollableStart: () => true, scrollToStart },
    );

    buttonOf(container)!.click();

    expect(scrollToStart).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("behavior 可覆盖", () => {
    const scrollToEnd = vi.fn(() => true);
    const { container } = renderButton(
      { behavior: "auto" },
      { scrollableEnd: () => true, scrollToEnd },
    );

    buttonOf(container)!.click();

    expect(scrollToEnd).toHaveBeenCalledWith({ behavior: "auto" });
  });

  it("不可滚时点击不发命令", () => {
    const scrollToEnd = vi.fn(() => true);
    const { container } = renderButton(
      {},
      { scrollableEnd: () => false, scrollToEnd },
    );

    buttonOf(container)!.click();

    expect(scrollToEnd).not.toHaveBeenCalled();
  });

  it("用户 onClick 先于命令执行", () => {
    const calls: string[] = [];
    const scrollToEnd = vi.fn(() => {
      calls.push("scroll");
      return true;
    });
    const { container } = renderButton(
      { onClick: () => calls.push("click") },
      { scrollableEnd: () => true, scrollToEnd },
    );

    buttonOf(container)!.click();

    expect(calls).toEqual(["click", "scroll"]);
  });

  it("用户 onClick 里 preventDefault 会阻止滚动", () => {
    const scrollToEnd = vi.fn(() => true);
    const { container } = renderButton(
      {
        onClick: (event: MouseEvent) => event.preventDefault(),
      },
      { scrollableEnd: () => true, scrollToEnd },
    );

    buttonOf(container)!.click();

    expect(scrollToEnd).not.toHaveBeenCalled();
  });

  it("支持 Solid 的 [handler, data] 形式", () => {
    const handler = vi.fn();
    const { container } = renderButton(
      { onClick: [handler, { reason: "button" }] as never },
      { scrollableEnd: () => true },
    );

    buttonOf(container)!.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toEqual({ reason: "button" });
    expect(handler.mock.calls[0]?.[1]).toBeInstanceOf(MouseEvent);
  });
});

describe("MessageScrollerButton - 脱离 Provider", () => {
  it("抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <MessageScrollerButton />)).toThrow(
      /<MessageScrollerButton> 必须渲染在 <MessageScrollerProvider> 内部/,
    );

    error.mockRestore();
  });
});

describe("MessageScrollerButton - context 兼容", () => {
  it("只读取 direction 对应方向的信号（另一个方向不参与判定）", () => {
    const readEnd: string[] = [];
    const context: Partial<MessageScrollerContextValue> = {
      scrollableEnd: () => {
        readEnd.push("end");
        return false;
      },
    };
    renderButton({}, context);

    expect(readEnd.length).toBeGreaterThan(0);
  });
});
