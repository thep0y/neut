import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { InputGroup } from "~/components/input-group/InputGroup/InputGroup";

/** InputGroup：套在输入框外层的容器，`role="group"` + 合并样式/属性。 */
describe("InputGroup", () => {
  it("渲染 role=group 的容器并带 data-slot", () => {
    const { container } = render(() => <InputGroup />);
    const group = container.querySelector('[data-slot="input-group"]');

    expect(group?.tagName).toBe("DIV");
    expect(group?.getAttribute("role")).toBe("group");
  });

  it("合并基础类名、外部 class 与 classList", () => {
    const { container } = render(() => (
      <InputGroup class="my-group" classList={{ "is-focus": true }} />
    ));
    const group = container.querySelector('[data-slot="input-group"]');

    expect(group?.className).toContain("group/input-group");
    expect(group?.className).toContain("my-group");
    expect(group?.className).toContain("is-focus");
  });

  it("透传其余属性并渲染 children", () => {
    const { container } = render(() => (
      <InputGroup id="grp" data-testid="g">
        <span>内容</span>
      </InputGroup>
    ));
    const group = container.querySelector('[data-slot="input-group"]');

    expect(group?.id).toBe("grp");
    expect(container.querySelector("span")?.textContent).toBe("内容");
  });
});
