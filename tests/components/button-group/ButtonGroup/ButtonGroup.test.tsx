import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ButtonGroup } from "~/components/button-group/ButtonGroup/ButtonGroup";

function groupOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="button-group"]') as HTMLElement;
}

/** ButtonGroup：把一组按钮/输入框拼成一条（默认横向，可纵向）。 */
describe("ButtonGroup - 方向", () => {
  it("渲染 fieldset（隐式 role=group），带 data-slot 与默认横向类名", () => {
    const { container, getByRole } = render(() => (
      <ButtonGroup aria-label="文本格式" />
    ));
    const element = groupOf(container);

    expect(element.tagName).toBe("FIELDSET");
    expect(element.getAttribute("data-slot")).toBe("button-group");
    expect(getByRole("group", { name: "文本格式" })).toBe(element);
    expect(element.classList.contains("w-fit")).toBe(true);
    expect(element.classList.contains("items-stretch")).toBe(true);
    expect(element.classList.contains("*:data-slot:rounded-r-none")).toBe(true);
    expect(element.classList.contains("flex-col")).toBe(false);
  });

  it("orientation=vertical 写入 data-orientation 并换掉横向拼接类名", () => {
    const { container } = render(() => <ButtonGroup orientation="vertical" />);
    const element = groupOf(container);

    expect(element.getAttribute("data-orientation")).toBe("vertical");
    expect(element.classList.contains("flex-col")).toBe(true);
    expect(element.classList.contains("*:data-slot:rounded-b-none")).toBe(true);
    expect(element.classList.contains("*:data-slot:rounded-r-none")).toBe(
      false,
    );
  });

  it("orientation=horizontal 显式传入时 data-orientation 与横向类名一起成立", () => {
    const vertical = groupOf(
      render(() => <ButtonGroup orientation="vertical" />).container,
    );
    const horizontal = groupOf(
      render(() => <ButtonGroup orientation="horizontal" />).container,
    );

    expect(horizontal.getAttribute("data-orientation")).toBe("horizontal");
    expect(horizontal.classList.contains("*:data-slot:rounded-r-none")).toBe(
      true,
    );
    expect(vertical.classList.contains("*:data-slot:rounded-r-none")).toBe(
      false,
    );
  });

  it("[当前行为] 未传 orientation 时只应用横向类名，不输出 data-orientation", () => {
    // 观察项：本仓库的 Bubble / BubbleReactions / ButtonGroupSeparator 都会用
    // mergeProps 补默认值并落到 data-* 上；ButtonGroup 的默认值只存在于 cva，
    // 因此默认状态下 data-orientation 缺失（见报告「未覆盖/观察项」）。
    const { container } = render(() => <ButtonGroup />);
    const element = groupOf(container);

    expect(element.hasAttribute("data-orientation")).toBe(false);
    expect(element.classList.contains("*:data-slot:rounded-r-none")).toBe(true);
  });
});

describe("ButtonGroup - 透传", () => {
  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <ButtonGroup class="my-group" classList={{ "is-compact": true }} />
    ));
    const element = groupOf(container);

    expect(element.classList.contains("my-group")).toBe(true);
    expect(element.classList.contains("is-compact")).toBe(true);
    expect(element.classList.contains("w-fit")).toBe(true);
  });

  it("透传其余属性、disabled 与 children（fieldset 语义）", () => {
    const { container } = render(() => (
      <ButtonGroup disabled aria-label="已锁定" data-group-id="g-1">
        <button type="button">加粗</button>
        <button type="button">斜体</button>
      </ButtonGroup>
    ));
    const element = groupOf(container);

    expect(element.hasAttribute("disabled")).toBe(true);
    expect(element.getAttribute("data-group-id")).toBe("g-1");
    expect(element.querySelectorAll("button")).toHaveLength(2);
  });
});
