import userEvent from "@testing-library/user-event";
import { For } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { ComboboxChip } from "~/components/combobox/ComboboxChip/ComboboxChip";
import { ComboboxChips } from "~/components/combobox/ComboboxChips/ComboboxChips";
import { ComboboxChipsInput } from "~/components/combobox/ComboboxChipsInput/ComboboxChipsInput";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { ComboboxValue } from "~/components/combobox/ComboboxValue/ComboboxValue";
import {
  allBySlot,
  bySlot,
  comboboxInput,
  comboboxOptions,
  renderCombobox,
} from "./test-utils";

/**
 * chips 模式的跨组件组合：`ComboboxChips` + `ComboboxValue`（用函数 children
 * 把选中值映射成 chip）+ `ComboboxChip` + `ComboboxChipsInput` + 列表。
 *
 * 这是"多选 + chips"的完整用户路径：输入过滤 → 点选累加 → chip 出现 →
 * 点 chip 上的删除按钮移除 → 面板保持打开。
 */
function renderChips(options: Parameters<typeof renderCombobox>[0] = {}) {
  return renderCombobox({ multiple: true, open: true, ...options }, () => (
    <ComboboxChips>
      <ComboboxValue>
        {(values: any[]) => (
          <For each={values}>
            {(item) => <ComboboxChip value={item}>{String(item)}</ComboboxChip>}
          </For>
        )}
      </ComboboxValue>
      <ComboboxChipsInput placeholder="搜索" />
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxChips>
  ));
}

describe("combobox chips 集成 - 增删", () => {
  it("输入过滤后点击选项把值累加进 chips", async () => {
    const onValueChange = vi.fn();
    renderChips({ defaultValue: ["apple"], onValueChange });
    const user = userEvent.setup();
    expect(allBySlot("combobox-chip")).toHaveLength(1);

    await user.type(comboboxInput(), "ban");
    expect(comboboxOptions().map((o) => o.textContent)).toEqual(["banana"]);

    await user.click(comboboxOptions()[0]);

    expect(onValueChange).toHaveBeenCalledWith(
      ["apple", "banana"],
      expect.anything(),
    );
    expect(allBySlot("combobox-chip").map((c) => c.textContent)).toEqual([
      "apple",
      "banana",
    ]);
  });

  it("多选下点选后不关闭面板", async () => {
    const onOpenChange = vi.fn();
    renderChips({ onOpenChange });
    const user = userEvent.setup();

    await user.click(comboboxOptions()[0]);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("点 chip 上的删除按钮移除该项并保留其余 chips", async () => {
    const onValueChange = vi.fn();
    renderChips({ defaultValue: ["apple", "banana"], onValueChange });
    const user = userEvent.setup();

    const removeButtons = allBySlot("combobox-chip-remove");
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[0]);

    expect(onValueChange).toHaveBeenCalledWith(["banana"], expect.anything());
    expect(allBySlot("combobox-chip").map((c) => c.textContent)).toEqual([
      "banana",
    ]);
  });

  it("chips 输入框与选项过滤联动，输入清空后恢复全部", async () => {
    renderChips();
    const user = userEvent.setup();

    await user.type(comboboxInput(), "cher");
    expect(comboboxOptions().map((o) => o.textContent)).toEqual(["cherry"]);

    await user.clear(comboboxInput());
    expect(comboboxOptions()).toHaveLength(3);
  });

  it("受控模式下点选只回调、内部 chips 不变", async () => {
    const onValueChange = vi.fn();
    renderChips({ value: ["apple"], onValueChange });
    const user = userEvent.setup();
    expect(allBySlot("combobox-chip").map((c) => c.textContent)).toEqual([
      "apple",
    ]);

    await user.click(comboboxOptions()[1]);

    expect(onValueChange).toHaveBeenCalledWith(
      ["apple", "banana"],
      expect.anything(),
    );
    // 受控：内部不写状态，chips 仍只有外部给的 apple
    expect(allBySlot("combobox-chip").map((c) => c.textContent)).toEqual([
      "apple",
    ]);
  });

  it("chips 容器既是锚点也是 toolbar，删除按钮带 combobox-chip-remove 标识", () => {
    renderChips({ defaultValue: ["apple"] });

    expect(bySlot("combobox-chips")).toHaveAttribute("role", "toolbar");
    expect(bySlot("combobox-chip-remove")).not.toBeNull();
  });
});
