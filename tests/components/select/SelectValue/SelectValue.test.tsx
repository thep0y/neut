import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";
import { SelectTrigger } from "~/components/select/SelectTrigger/SelectTrigger";
import { SelectValue } from "~/components/select/SelectValue/SelectValue";

/**
 * `SelectValue` 的展示文本推导：`label() ?? props.placeholder ?? ""`，
 * 即"有选中值就显示它的 label → 否则显示 placeholder → 都没有就空串"。
 * 这里渲染真实 Select 树，从 trigger 的文本读出结果。
 */
async function renderValue(props: {
  defaultValue?: string;
  placeholder?: string;
  itemLabel?: string;
}) {
  render(() => (
    <Select defaultOpen defaultValue={props.defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple" label={props.itemLabel}>
          苹果
        </SelectItem>
      </SelectContent>
    </Select>
  ));
  await Promise.resolve();
  await Promise.resolve();
}

const triggerText = () => document.querySelector("button")?.textContent ?? "";

describe("SelectValue - 展示文本推导", () => {
  it("有选中值时显示该项的 label", async () => {
    await renderValue({ defaultValue: "apple", placeholder: "请选择" });

    expect(triggerText()).toContain("苹果");
  });

  it("显式 label 优先于 children", async () => {
    await renderValue({
      defaultValue: "apple",
      placeholder: "请选择",
      itemLabel: "苹果（label）",
    });

    expect(triggerText()).toContain("苹果（label）");
  });

  it("未选中且未传 placeholder 时展示空串（不报错）", async () => {
    // 覆盖 `?? ""` 兜底：既没有 label 也没有 placeholder
    await renderValue({});

    expect(triggerText()).toBe("");
  });

  it("未选中但传了 placeholder 时展示 placeholder", async () => {
    await renderValue({ placeholder: "请选择" });

    expect(triggerText()).toContain("请选择");
  });
});
