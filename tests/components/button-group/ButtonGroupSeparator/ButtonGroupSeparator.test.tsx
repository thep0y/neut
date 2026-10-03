import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ButtonGroupSeparator } from "~/components/button-group/ButtonGroupSeparator/ButtonGroupSeparator";

function separatorOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="button-group-separator"]',
  ) as HTMLElement;
}

/** ButtonGroupSeparator：按钮之间的分隔线，默认纵向（trailing 竖线）。 */
describe("ButtonGroupSeparator", () => {
  it("默认渲染纵向分隔线：data-slot、data-orientation=vertical 与垂直类名", () => {
    const { container } = render(() => <ButtonGroupSeparator />);
    const element = separatorOf(container);

    expect(element.getAttribute("data-slot")).toBe("button-group-separator");
    expect(element.getAttribute("data-orientation")).toBe("vertical");
    expect(element.hasAttribute("data-vertical")).toBe(true);
    expect(element.hasAttribute("data-horizontal")).toBe(false);
    expect(element.classList.contains("bg-input")).toBe(true);
    expect(element.classList.contains("data-vertical:h-auto")).toBe(true);
  });

  it("orientation=horizontal 时切到水平分隔线（双向）", () => {
    const { container } = render(() => (
      <ButtonGroupSeparator orientation="horizontal" />
    ));
    const element = separatorOf(container);

    expect(element.getAttribute("data-orientation")).toBe("horizontal");
    expect(element.hasAttribute("data-horizontal")).toBe(true);
    expect(element.hasAttribute("data-vertical")).toBe(false);
    expect(element.classList.contains("data-horizontal:w-auto")).toBe(true);
  });

  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <ButtonGroupSeparator class="my-sep" classList={{ "is-thick": true }} />
    ));
    const element = separatorOf(container);

    expect(element.classList.contains("my-sep")).toBe(true);
    expect(element.classList.contains("is-thick")).toBe(true);
    expect(element.classList.contains("relative")).toBe(true);
    expect(element.classList.contains("self-stretch")).toBe(true);
  });

  it("透传其余属性到内部分隔线元素", () => {
    const { container } = render(() => (
      <ButtonGroupSeparator id="sep-1" aria-orientation="vertical" />
    ));
    const element = separatorOf(container);

    expect(element.id).toBe("sep-1");
    expect(element.getAttribute("aria-orientation")).toBe("vertical");
  });
});
