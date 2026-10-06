import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Collapsible } from "~/components/collapsible/Collapsible/Collapsible";
import { CollapsibleTrigger } from "~/components/collapsible/CollapsibleTrigger/CollapsibleTrigger";

/**
 * CollapsibleTrigger：基于 Button 的开关按钮。
 *
 * 它从 context 读状态、点击时翻转并把新值回调出去；
 * 用户自己的 `onClick` 在状态变更之后执行，不会被内部处理器覆盖。
 */
function renderTrigger(
  rootProps: Record<string, unknown> = {},
  triggerProps: Record<string, unknown> = {},
) {
  const view = render(() => (
    <Collapsible {...rootProps}>
      <CollapsibleTrigger {...triggerProps}>切换</CollapsibleTrigger>
    </Collapsible>
  ));
  const trigger = () =>
    view.container.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    ) as HTMLButtonElement;
  return { ...view, trigger };
}

describe("CollapsibleTrigger - 结构与 ARIA", () => {
  it("渲染 button[data-slot=collapsible-trigger]，默认关闭", () => {
    const { trigger } = renderTrigger();

    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger().getAttribute("data-slot")).toBe("collapsible-trigger");
    expect(trigger().getAttribute("data-panel-open")).toBe("false");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().textContent).toContain("切换");
  });

  it("defaultOpen 时 aria-expanded 与 data-panel-open 都是 true", () => {
    const { trigger } = renderTrigger({ defaultOpen: true });

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().getAttribute("data-panel-open")).toBe("true");
  });
});

describe("CollapsibleTrigger - 非受控交互", () => {
  it("点击展开再点击收起，onOpenChange 收到新值", () => {
    const onOpenChange = vi.fn();
    const { trigger } = renderTrigger({ onOpenChange });

    fireEvent.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().getAttribute("data-panel-open")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("没有传 onOpenChange 时点击也不报错，状态照常翻转", () => {
    const { trigger } = renderTrigger();

    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });
});

describe("CollapsibleTrigger - 受控模式", () => {
  it("点击只回调 onOpenChange，自身 aria 状态由外部决定", () => {
    const onOpenChange = vi.fn();
    const { trigger } = renderTrigger({ open: false, onOpenChange });

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("data-panel-open")).toBe("false");
  });

  it("外部回写 open 后 aria-expanded 跟随", () => {
    const [open, setOpen] = createSignal(false);
    const view = render(() => (
      <Collapsible open={open()}>
        <CollapsibleTrigger>切换</CollapsibleTrigger>
      </Collapsible>
    ));
    const trigger = () =>
      view.container.querySelector<HTMLButtonElement>(
        '[data-slot="collapsible-trigger"]',
      ) as HTMLButtonElement;

    expect(trigger().getAttribute("aria-expanded")).toBe("false");

    setOpen(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().getAttribute("data-panel-open")).toBe("true");
  });
});

describe("CollapsibleTrigger - 用户 onClick 与属性透传", () => {
  it("用户 onClick 在状态回调之后执行，结果不被覆盖", () => {
    const calls: string[] = [];
    const onOpenChange = vi.fn(() => {
      calls.push("open-change");
    });
    const onClick = vi.fn(() => {
      calls.push("user-click");
    });
    const { trigger } = renderTrigger({ onOpenChange }, { onClick });

    fireEvent.click(trigger());

    expect(calls).toEqual(["open-change", "user-click"]);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("disabled 透传到 button", () => {
    const { trigger } = renderTrigger({}, { disabled: true });

    expect(trigger().disabled).toBe(true);
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { trigger } = renderTrigger(
      {},
      {
        class: "my-trigger",
        classList: { "is-open": true },
        id: "trig",
        "aria-label": "展开详情",
      },
    );

    expect(trigger().className).toContain("my-trigger");
    expect(trigger().className).toContain("is-open");
    expect(trigger().id).toBe("trig");
    expect(trigger().getAttribute("aria-label")).toBe("展开详情");
  });
});
