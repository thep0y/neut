import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ButtonGroupText } from "~/components/button-group/ButtonGroupText/ButtonGroupText";

function textOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="button-group-text"]',
  ) as HTMLElement;
}

/** ButtonGroupText：按钮组里的文本/图标槽（div）。 */
describe("ButtonGroupText", () => {
  it("渲染 div，带 data-slot 与内置文本类名", () => {
    const { container } = render(() => <ButtonGroupText>折叠</ButtonGroupText>);
    const element = textOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("button-group-text");
    expect(element.classList.contains("bg-muted")).toBe(true);
    expect(element.classList.contains("rounded-lg")).toBe(true);
    expect(element.classList.contains("text-sm")).toBe(true);
    expect(element.classList.contains("font-medium")).toBe(true);
    expect(element.textContent).toBe("折叠");
  });

  it("classList 与内置类名一起生效", () => {
    const { container } = render(() => (
      <ButtonGroupText classList={{ "is-active": true }} />
    ));
    const element = textOf(container);

    expect(element.classList.contains("is-active")).toBe(true);
    expect(element.classList.contains("bg-muted")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ButtonGroupText id="label" aria-hidden="true" data-label="格式">
        <span data-testid="icon" />
        格式
      </ButtonGroupText>
    ));
    const element = textOf(container);

    expect(element.id).toBe("label");
    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(element.getAttribute("data-label")).toBe("格式");
    expect(container.querySelector('[data-testid="icon"]')).not.toBeNull();
  });

  it("传 class 时内置类名仍然保留（回归）", () => {
    // 此前源码把 `class={clsx(classes, props.class)}` 写在 `{...props}` 之前，
    // Solid 的 spread 随后用 node.className 重设，内置类名被整体覆盖，
    // 只剩调用方的 class（classList 反而因为后应用而侥幸保留，现象更隐蔽）。
    const { container } = render(() => (
      <ButtonGroupText class="my-text" classList={{ "is-on": true }} />
    ));
    const element = textOf(container);

    expect(element.classList.contains("my-text")).toBe(true);
    expect(element.classList.contains("is-on")).toBe(true);
    // 内置样式必须还在
    expect(element.classList.contains("bg-muted")).toBe(true);
    expect(element.classList.contains("rounded-lg")).toBe(true);
    expect(element.classList.contains("px-2.5")).toBe(true);
  });
});
