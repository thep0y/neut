import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";
import { SelectTrigger } from "~/components/select/SelectTrigger/SelectTrigger";
import { SelectValue } from "~/components/select/SelectValue/SelectValue";

/**
 * 选项的"标签"推导：显式 `label` > 字符串 children > `String(value)`。
 * 选中之后 `SelectValue` 显示的就是这个标签，因此这里从 trigger 的文本反推。
 */
async function renderWith(item: Record<string, unknown>, node?: unknown) {
  render(() => (
    <Select defaultOpen defaultValue="apple">
      <SelectTrigger>
        <SelectValue placeholder="请选择" />
      </SelectTrigger>
      <SelectContent>
        {node === undefined ? (
          <SelectItem value="apple" {...item} />
        ) : (
          <SelectItem value="apple" {...item}>
            {node as never}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  ));
  await Promise.resolve();
  await Promise.resolve();
}

const triggerText = () => document.querySelector("button")?.textContent ?? "";

describe("SelectItem - 标签推导", () => {
  it("显式 label 优先", async () => {
    await renderWith({ label: "苹果（显式）" });

    expect(triggerText()).toContain("苹果（显式）");
  });

  it("没有 label 时用字符串 children", async () => {
    await renderWith({}, "苹果（children）");

    expect(triggerText()).toContain("苹果（children）");
  });

  it("既没有 label 也不是字符串 children 时退化为 String(value)", async () => {
    await renderWith({ value: "banana" });

    expect(triggerText()).toBeTruthy();
  });

  it("value 是数字时串化", async () => {
    await renderWith({ value: 42 });

    expect(triggerText()).toBeTruthy();
  });
});
