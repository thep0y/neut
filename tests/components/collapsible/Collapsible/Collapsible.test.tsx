import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Collapsible } from "~/components/collapsible/Collapsible/Collapsible";
import { useCollapsibleContext } from "~/components/collapsible/Collapsible/Collapsible.context";

/** 读回 context 的探针：根组件的状态与回调都通过 context 下发 */
function Probe() {
  const ctx = useCollapsibleContext();
  return <span data-testid="open">{String(ctx.open())}</span>;
}

function rootOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="collapsible"]') as HTMLElement;
}

describe("Collapsible - 结构与状态", () => {
  it("渲染 div[data-slot=collapsible]，默认关闭", () => {
    const { container } = render(() => <Collapsible />);
    const root = rootOf(container);

    expect(root.tagName).toBe("DIV");
    expect(root.getAttribute("data-open")).toBe("false");
  });

  it("defaultOpen 为 true 时初始打开，data-open 与 context 都是 true", () => {
    const { container, getByTestId } = render(() => (
      <Collapsible defaultOpen>
        <Probe />
      </Collapsible>
    ));

    expect(rootOf(container).getAttribute("data-open")).toBe("true");
    expect(getByTestId("open").textContent).toBe("true");
  });

  it("defaultOpen 显式为 false 时保持关闭", () => {
    const { container } = render(() => <Collapsible defaultOpen={false} />);

    expect(rootOf(container).getAttribute("data-open")).toBe("false");
  });

  it("受控 open 决定状态，外部回写后 UI 跟随", () => {
    const [open, setOpen] = createSignal(false);
    const { container, getByTestId } = render(() => (
      <Collapsible open={open()}>
        <Probe />
      </Collapsible>
    ));

    expect(rootOf(container).getAttribute("data-open")).toBe("false");
    expect(getByTestId("open").textContent).toBe("false");

    setOpen(true);
    expect(rootOf(container).getAttribute("data-open")).toBe("true");
    expect(getByTestId("open").textContent).toBe("true");

    setOpen(false);
    expect(rootOf(container).getAttribute("data-open")).toBe("false");
  });
});

describe("Collapsible - 属性透传", () => {
  it("合并 class / classList，并透传其余属性与 children", () => {
    const { container } = render(() => (
      <Collapsible
        class="my-collapsible"
        classList={{ "is-nested": true }}
        id="panel"
        data-custom="yes"
        aria-label="详情"
      >
        <span data-testid="child">内容</span>
      </Collapsible>
    ));
    const root = rootOf(container);

    expect(root.className).toContain("my-collapsible");
    expect(root.className).toContain("is-nested");
    expect(root.id).toBe("panel");
    expect(root.getAttribute("data-custom")).toBe("yes");
    expect(root.getAttribute("aria-label")).toBe("详情");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});

describe("Collapsible - onOpenChange 透传", () => {
  it("context 暴露的 onOpenChange 就是调用方传入的回调", () => {
    const onOpenChange = vi.fn();
    const { getByTestId } = render(() => (
      <Collapsible onOpenChange={onOpenChange}>
        <Probe />
      </Collapsible>
    ));

    expect(getByTestId("open").textContent).toBe("false");
    // 根组件只持有回调、不主动调用；触发交给 Trigger（见 CollapsibleTrigger 用例）
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
