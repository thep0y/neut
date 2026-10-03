import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MarkerIcon } from "~/components/marker/MarkerIcon/MarkerIcon";

function iconOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="marker-icon"]') as HTMLElement;
}

/** MarkerIcon：装饰性图标槽，始终对辅助技术隐藏。 */
describe("MarkerIcon", () => {
  it("渲染 span，带 data-slot 与尺寸类名", () => {
    const { container } = render(() => (
      <MarkerIcon>
        <svg aria-hidden="true" />
      </MarkerIcon>
    ));
    const element = iconOf(container);

    expect(element.tagName).toBe("SPAN");
    expect(element.getAttribute("data-slot")).toBe("marker-icon");
    expect(element.classList.contains("size-4")).toBe(true);
    expect(element.classList.contains("shrink-0")).toBe(true);
    expect(element.children).toHaveLength(1);
  });

  it("始终 aria-hidden=true：调用方显式传 false 也不会暴露给辅助技术", () => {
    const { container } = render(() => <MarkerIcon aria-hidden={false} />);

    expect(iconOf(container).getAttribute("aria-hidden")).toBe("true");
  });

  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <MarkerIcon class="my-icon" classList={{ "is-spinning": true }} />
    ));
    const element = iconOf(container);

    expect(element.classList.contains("my-icon")).toBe(true);
    expect(element.classList.contains("is-spinning")).toBe(true);
    expect(element.classList.contains("size-4")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <MarkerIcon data-testid="icon" title="加载中">
        <span data-testid="inner" />
      </MarkerIcon>
    ));
    const element = container.querySelector(
      '[data-testid="icon"]',
    ) as HTMLElement;

    expect(element.getAttribute("title")).toBe("加载中");
    expect(container.querySelector('[data-testid="inner"]')).not.toBeNull();
  });
});
