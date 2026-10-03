import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectGroup } from "~/components/select/SelectGroup/SelectGroup";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";

/**
 * `SelectGroup`：把若干 `SelectItem` 包成 `role="group"` 的 `<li>`。
 *
 * `SelectContent` 通过 Portal 挂到 body，且子节点要等挂载后的微任务才落地
 * （见 TESTING.md §5.6），因此断言用 document 查询并先 flush 一次。
 */
async function renderGroup() {
  render(() => (
    <Select defaultOpen>
      <SelectContent>
        <SelectGroup data-testid="group">
          <SelectItem value="apple">苹果</SelectItem>
          <SelectItem value="banana">香蕉</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ));
  await Promise.resolve();
  await Promise.resolve();
}

const group = () => document.querySelector('[role="group"]') as HTMLElement;

describe("SelectGroup", () => {
  it("渲染为 role=group 的 li", async () => {
    await renderGroup();

    expect(group().tagName).toBe("LI");
  });

  it("渲染 children（组内的选项）", async () => {
    await renderGroup();

    expect(group().querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it("透传其余属性（回归：此前只渲染 children，属性全被丢弃）", async () => {
    await renderGroup();

    expect(group().getAttribute("data-testid")).toBe("group");
  });

  it("合并调用方 class 与 classList，并带 data-slot（回归）", async () => {
    render(() => (
      <Select defaultOpen>
        <SelectContent>
          <SelectGroup
            class="my-group"
            classList={{ "is-group": true }}
            aria-label="水果"
          >
            <SelectItem value="apple">苹果</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ));
    await Promise.resolve();
    await Promise.resolve();

    const element = document.querySelector('[role="group"]') as HTMLElement;
    expect(element.className).toContain("my-group");
    expect(element.className).toContain("is-group");
    expect(element.getAttribute("data-slot")).toBe("select-group");
    expect(element.getAttribute("aria-label")).toBe("水果");
  });
});
