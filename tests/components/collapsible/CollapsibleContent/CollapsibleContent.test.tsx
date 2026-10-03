import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Collapsible } from "~/components/collapsible/Collapsible/Collapsible";
import { CollapsibleContent } from "~/components/collapsible/CollapsibleContent/CollapsibleContent";

/**
 * CollapsibleContent：关闭时**不渲染**（`Show`），打开时才挂载内容。
 */
function renderContent(
  rootProps: Record<string, unknown> = {},
  contentProps: Record<string, unknown> = {},
) {
  const view = render(() => (
    <Collapsible {...rootProps}>
      <CollapsibleContent {...contentProps}>正文</CollapsibleContent>
    </Collapsible>
  ));
  const content = () =>
    view.container.querySelector<HTMLElement>(
      '[data-slot="collapsible-content"]',
    );
  return { ...view, content };
}

describe("CollapsibleContent - 挂载与卸载", () => {
  it("默认关闭时不渲染内容", () => {
    const { content } = renderContent();

    expect(content()).toBeNull();
  });

  it("defaultOpen 打开时渲染 div[data-slot=collapsible-content] 与 children", () => {
    const { content } = renderContent({ defaultOpen: true });

    expect(content()).not.toBeNull();
    expect(content()?.tagName).toBe("DIV");
    expect(content()?.textContent).toBe("正文");
  });

  it("受控 open 变化时挂载 / 卸载", () => {
    const [open, setOpen] = createSignal(false);
    const view = render(() => (
      <Collapsible open={open()}>
        <CollapsibleContent>正文</CollapsibleContent>
      </Collapsible>
    ));
    const content = () =>
      view.container.querySelector<HTMLElement>(
        '[data-slot="collapsible-content"]',
      );

    expect(content()).toBeNull();

    setOpen(true);
    expect(content()).not.toBeNull();

    setOpen(false);
    expect(content()).toBeNull();
  });
});

describe("CollapsibleContent - 属性透传", () => {
  it("合并 class / classList", () => {
    const { content } = renderContent(
      { defaultOpen: true },
      { class: "my-content", classList: { "is-open": true } },
    );

    expect(content()?.className).toContain("my-content");
    expect(content()?.className).toContain("is-open");
  });

  it("透传其余属性与 children", () => {
    const { content, container } = renderContent(
      { defaultOpen: true },
      { id: "body", "data-custom": "yes" },
    );

    expect(content()?.id).toBe("body");
    expect(content()?.getAttribute("data-custom")).toBe("yes");
    expect(container.textContent).toContain("正文");
  });
});
