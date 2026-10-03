import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectSeparator } from "~/components/select/SelectSeparator/SelectSeparator";

/** `SelectSeparator`：选项之间的分隔线，自身样式与调用方 class 合并。 */
async function renderSeparator(props: Record<string, unknown> = {}) {
  render(() => (
    <Select defaultOpen>
      <SelectContent>
        <SelectSeparator {...props} />
      </SelectContent>
    </Select>
  ));
  await Promise.resolve();
  await Promise.resolve();
}

const separator = () =>
  document.querySelector('[data-slot="separator"]') as HTMLElement | null;

describe("SelectSeparator", () => {
  it("渲染分隔元素", async () => {
    await renderSeparator();

    expect(separator()).not.toBeNull();
  });

  it("合并自身 my-1 与调用方 class", async () => {
    await renderSeparator({ class: "my-separator" });

    expect(separator()?.className).toContain("my-1");
    expect(separator()?.className).toContain("my-separator");
  });

  it("透传其余属性", async () => {
    await renderSeparator({ "data-testid": "sep" });

    expect(document.querySelector('[data-testid="sep"]')).not.toBeNull();
  });
});
