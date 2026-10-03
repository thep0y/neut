import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Collapsible } from "~/components/collapsible/Collapsible/Collapsible";
import { CollapsibleContent } from "~/components/collapsible/CollapsibleContent/CollapsibleContent";
import { CollapsibleTrigger } from "~/components/collapsible/CollapsibleTrigger/CollapsibleTrigger";

/**
 * Collapsible 集成测试：Trigger 翻转根状态，Content 根据同一个状态挂载 / 卸载。
 * 单测分别覆盖了各部件；这里验证它们通过 context 协作的净效果。
 */
function renderCollapsible(rootProps: Record<string, unknown> = {}) {
  const view = render(() => (
    <Collapsible {...rootProps}>
      <CollapsibleTrigger>详情</CollapsibleTrigger>
      <CollapsibleContent>
        <p data-testid="body">折叠内容</p>
      </CollapsibleContent>
    </Collapsible>
  ));
  const trigger = () =>
    view.container.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    ) as HTMLButtonElement;
  const root = () =>
    view.container.querySelector<HTMLElement>(
      '[data-slot="collapsible"]',
    ) as HTMLElement;
  return { ...view, trigger, root };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Collapsible - 组合行为", () => {
  it("点击 trigger 展开内容，再点击收起", () => {
    const { trigger, root, queryByTestId } = renderCollapsible();

    expect(queryByTestId("body")).toBeNull();
    expect(root().getAttribute("data-open")).toBe("false");

    fireEvent.click(trigger());
    expect(queryByTestId("body")).not.toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(root().getAttribute("data-open")).toBe("true");

    fireEvent.click(trigger());
    expect(queryByTestId("body")).toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(root().getAttribute("data-open")).toBe("false");
  });

  it("onOpenChange 与内容挂载同步，并在展开/收起两向都回调", () => {
    const onOpenChange = vi.fn();
    const { trigger, queryByTestId } = renderCollapsible({ onOpenChange });

    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(queryByTestId("body")).not.toBeNull();

    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(queryByTestId("body")).toBeNull();
  });

  it("受控组合：内容跟随外部 open，而不是自身点击", () => {
    const [open, setOpen] = createSignal(false);
    const onOpenChange = vi.fn();
    const view = render(() => (
      <Collapsible open={open()} onOpenChange={onOpenChange}>
        <CollapsibleTrigger>详情</CollapsibleTrigger>
        <CollapsibleContent>
          <p data-testid="body">折叠内容</p>
        </CollapsibleContent>
      </Collapsible>
    ));
    const trigger = () =>
      view.container.querySelector<HTMLButtonElement>(
        '[data-slot="collapsible-trigger"]',
      ) as HTMLButtonElement;

    expect(view.queryByTestId("body")).toBeNull();

    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(view.queryByTestId("body")).toBeNull();

    setOpen(true);
    expect(view.queryByTestId("body")).not.toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");

    setOpen(false);
    expect(view.queryByTestId("body")).toBeNull();
  });
});

describe("Collapsible - 上下文约束", () => {
  it("CollapsibleTrigger 脱离 Collapsible 抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => <CollapsibleTrigger>孤立</CollapsibleTrigger>),
    ).toThrow(/useCollapsibleContext 必须用在 <Collapsible> 内部/);

    error.mockRestore();
  });

  it("CollapsibleContent 脱离 Collapsible 抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => <CollapsibleContent>孤立</CollapsibleContent>),
    ).toThrow(/useCollapsibleContext 必须用在 <Collapsible> 内部/);

    error.mockRestore();
  });
});
