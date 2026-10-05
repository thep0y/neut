import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";

/**
 * `SelectContent` 的边界分支：
 * - 没有可选项时方向键要安全早退（`if (list.length === 0) return;`）；
 * - `style` 允许传对象，会与内部的内联样式合并（而不是整体替换）。
 */
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * 用户 style 落在**内层**布局 div（`role="listbox"`）上；
 * 外层 `data-slot="select-content"` 是 positioner 的定位层，只写 transform/定位。
 */
const listbox = () =>
  document.querySelector('[role="listbox"]') as HTMLElement | null;

describe("SelectContent - 边界分支（回归）", () => {
  it("没有任何可选项时方向键不抛错、也不设置高亮", async () => {
    render(() => (
      <Select<string> defaultOpen>
        <SelectContent>{null}</SelectContent>
      </Select>
    ));
    await flush();

    for (const key of ["ArrowDown", "ArrowUp"]) {
      expect(() => fireEvent.keyDown(document, { key })).not.toThrow();
    }
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
  });

  it("style 传对象时与内部内联样式合并", async () => {
    render(() => (
      <Select defaultOpen>
        <SelectContent style={{ color: "red", overflow: "hidden" }}>
          {null}
        </SelectContent>
      </Select>
    ));
    await flush();

    const element = listbox();
    expect(element).not.toBeNull();
    // 用户传的键生效
    expect(element?.style.color).toBe("red");
    // 内部自己写的 overflow:auto 被用户值覆盖（合并顺序：内部在前、用户在后）
    expect(element?.style.overflow).toBe("hidden");
    // 内部固定写入的布局样式仍在（用户没覆盖 position）
    expect(element?.style.position).toBe("relative");
  });
});
