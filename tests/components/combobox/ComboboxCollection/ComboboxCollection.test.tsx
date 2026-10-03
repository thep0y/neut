import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ComboboxCollection } from "~/components/combobox/ComboboxCollection/ComboboxCollection";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { comboboxInput, renderCombobox } from "../test-utils";

/**
 * `ComboboxCollection`：无样式渲染列表数据（不产生列表容器/ARIA）。
 *
 * 与 `ComboboxList` 的差异：`items` prop 可覆盖根组件的 `items`，
 * 并且**总是**按 `filterValue` 过滤（不受"分组"判定影响）。
 */
describe("ComboboxCollection", () => {
  it("items prop 覆盖根组件的 items", () => {
    const { container } = renderCombobox({ items: ["apple", "banana"] }, () => (
      <ComboboxCollection items={["x", "y"]}>
        {(item: string) => <span>{item}</span>}
      </ComboboxCollection>
    ));

    expect(container).toHaveTextContent("x");
    expect(container).toHaveTextContent("y");
    expect(container).not.toHaveTextContent("apple");
  });

  it("未传 items 时使用根组件的 items", () => {
    const { container } = renderCombobox({ items: ["apple", "banana"] }, () => (
      <ComboboxCollection>
        {(item: string) => <span>{item}</span>}
      </ComboboxCollection>
    ));

    expect(container).toHaveTextContent("apple");
    expect(container).toHaveTextContent("banana");
  });

  it("函数 children 收到从 0 开始的 index", () => {
    const { container } = renderCombobox({ items: ["a", "b"] }, () => (
      <ComboboxCollection items={["a", "b"]}>
        {(item: string, index: number) => <span>{`${index}:${item};`}</span>}
      </ComboboxCollection>
    ));

    expect(container).toHaveTextContent("0:a;1:b;");
  });

  it("按输入过滤（大小写不敏感、忽略两端空白）", async () => {
    const { container } = renderCombobox({ items: ["apple", "banana"] }, () => (
      <>
        <ComboboxInput />
        <ComboboxCollection>
          {(item: string) => <span>{item}</span>}
        </ComboboxCollection>
      </>
    ));
    const user = userEvent.setup();

    await user.type(comboboxInput(), "  BAN ");

    expect(container).toHaveTextContent("banana");
    expect(container).not.toHaveTextContent("apple");
  });

  it("过滤无结果时不渲染任何条目", async () => {
    const { container } = renderCombobox({ items: ["apple", "banana"] }, () => (
      <>
        <ComboboxInput />
        <ComboboxCollection>
          {(item: string) => <span data-collection-item={item}>{item}</span>}
        </ComboboxCollection>
      </>
    ));
    const user = userEvent.setup();

    await user.type(comboboxInput(), "zzz");

    expect(container.querySelectorAll("[data-collection-item]")).toHaveLength(
      0,
    );
  });

  it("非函数 children 时直接渲染该节点", () => {
    const node = <span>固定内容</span>;
    const { container } = renderCombobox({ items: ["apple"] }, () => (
      <ComboboxCollection items={["apple"]}>{node}</ComboboxCollection>
    ));

    expect(container).toHaveTextContent("固定内容");
  });
});
