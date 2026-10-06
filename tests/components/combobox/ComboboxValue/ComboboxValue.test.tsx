import { describe, expect, it } from "vitest";
import { ComboboxValue } from "~/components/combobox/ComboboxValue/ComboboxValue";
import { renderCombobox } from "../test-utils";

/**
 * `ComboboxValue`：选中值的展示层。
 *
 * 三分支：函数 children（拿到选中值数组）、非函数 children（用 `itemToStringValue`
 * 拼接）、没有任何选中时的 placeholder。
 */
describe("ComboboxValue", () => {
  it("无选中项且未传 placeholder 时渲染为空", () => {
    const { container } = renderCombobox({}, () => <ComboboxValue />);

    expect(container).toBeEmptyDOMElement();
  });

  it("无选中项时展示 placeholder", () => {
    const { container } = renderCombobox({}, () => (
      <ComboboxValue placeholder="请选择" />
    ));

    expect(container).toHaveTextContent("请选择");
  });

  it("受控 value=null 时展示 placeholder", () => {
    const { container } = renderCombobox({ value: null }, () => (
      <ComboboxValue placeholder="请选择" />
    ));

    expect(container).toHaveTextContent("请选择");
  });

  it("单选时用 itemToStringValue 展示值", () => {
    const { container } = renderCombobox({ defaultValue: "apple" }, () => (
      <ComboboxValue />
    ));

    expect(container).toHaveTextContent("apple");
  });

  it("多选时用逗号连接所有选中值", () => {
    const { container } = renderCombobox(
      { multiple: true, defaultValue: ["apple", "banana"] },
      () => <ComboboxValue />,
    );

    expect(container).toHaveTextContent("apple, banana");
  });

  it("自定义 itemToStringValue 参与展示", () => {
    const { container } = renderCombobox(
      {
        defaultValue: "apple",
        itemToStringValue: (item: string) => `水果:${item}`,
      },
      () => <ComboboxValue />,
    );

    expect(container).toHaveTextContent("水果:apple");
  });

  it("函数 children 收到单选值数组", () => {
    const { container } = renderCombobox({ defaultValue: "apple" }, () => (
      <ComboboxValue>
        {(values: any[]) => <span>已选 {values.length} 项</span>}
      </ComboboxValue>
    ));

    expect(container).toHaveTextContent("已选 1 项");
  });

  it("函数 children 在多选时收到全部值", () => {
    const { container } = renderCombobox(
      { multiple: true, defaultValue: ["apple", "banana"] },
      () => (
        <ComboboxValue>
          {(values: any[]) => <span>{values.join("+")}</span>}
        </ComboboxValue>
      ),
    );

    expect(container).toHaveTextContent("apple+banana");
  });

  it("函数 children 在无选中时收到空数组", () => {
    const { container } = renderCombobox({}, () => (
      <ComboboxValue>
        {(values: any[]) => <span>已选 {values.length} 项</span>}
      </ComboboxValue>
    ));

    expect(container).toHaveTextContent("已选 0 项");
  });
});
