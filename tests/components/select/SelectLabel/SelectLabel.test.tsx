import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectLabel } from "~/components/select/SelectLabel/SelectLabel";

/** `SelectLabel`：分组标题，合并自身样式与调用方 class。 */
async function renderLabel(props: Record<string, unknown> = {}) {
  render(() => (
    <Select defaultOpen>
      <SelectContent>
        <SelectLabel {...props}>水果</SelectLabel>
      </SelectContent>
    </Select>
  ));
  await Promise.resolve();
  await Promise.resolve();
}

describe("SelectLabel", () => {
  it("渲染文本内容", async () => {
    await renderLabel();

    expect(document.body.textContent).toContain("水果");
  });

  it("合并调用方 class 与自身样式", async () => {
    await renderLabel({ class: "my-label" });
    const label = document.querySelector(".my-label") as HTMLElement;

    expect(label).not.toBeNull();
    expect(label.className).toContain("px-2");
  });

  it("透传其余属性", async () => {
    await renderLabel({ "data-testid": "label", id: "l" });

    expect(document.querySelector("#l")).not.toBeNull();
  });
});
