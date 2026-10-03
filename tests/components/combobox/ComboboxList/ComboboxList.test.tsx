import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxGroup } from "~/components/combobox/ComboboxGroup/ComboboxGroup";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxLabel } from "~/components/combobox/ComboboxLabel/ComboboxLabel";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import {
  bySlot,
  comboboxInput,
  comboboxOptions,
  renderCombobox,
} from "../test-utils";

/**
 * `ComboboxList`：`role=listbox` 的滚动列表。
 *
 * 它在"分组 items"形态下**不做过滤**（过滤交给分组内部各自的集合），
 * 因为分组对象的 `String()` 没有可搜索的语义。
 */
describe("ComboboxList", () => {
  it("渲染为 role=listbox 且带 data-slot", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <ComboboxList>
        {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
      </ComboboxList>
    ));

    const list = bySlot("combobox-list");
    expect(list).not.toBeNull();
    expect(list).toHaveAttribute("role", "listbox");
  });

  it("class 透传到滚动容器", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <ComboboxList class="my-list">
        {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
      </ComboboxList>
    ));

    expect(bySlot("combobox-list")).toHaveClass("my-list");
  });

  it("函数 children 渲染过滤后的条目", async () => {
    renderCombobox({ open: true, items: ["apple", "banana"] }, () => (
      <>
        <ComboboxInput />
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </>
    ));
    const user = userEvent.setup();

    await user.type(comboboxInput(), "ban");

    expect(comboboxOptions().map((o) => o.textContent)).toEqual(["banana"]);
  });

  it("分组 items 时渲染分组本身且过滤不影响分组列表", async () => {
    const groups = [{ label: "水果", items: ["apple", "banana"] }];
    renderCombobox({ open: true, items: groups }, () => (
      <>
        <ComboboxInput />
        <ComboboxList>
          {(group: any) => (
            <ComboboxGroup>
              <ComboboxLabel>{group.label}</ComboboxLabel>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </>
    ));
    const user = userEvent.setup();

    // "zzz" 会让 filteredItems 变空；分组形态下列表读的是 items()，分组仍在
    await user.type(comboboxInput(), "zzz");

    expect(bySlot("combobox-group")).not.toBeNull();
    expect(bySlot("combobox-list")).toHaveTextContent("水果");
  });

  it("非函数 children 时直接渲染该节点", () => {
    const node = <span>固定内容</span>;
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <ComboboxList>{node}</ComboboxList>
    ));

    expect(bySlot("combobox-list")).toHaveTextContent("固定内容");
  });

  it("作为 ComboboxContent 的子节点时渲染在浮层内", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    ));

    expect(
      bySlot("combobox-list")?.closest('[data-slot="combobox-content"]'),
    ).toBe(bySlot("combobox-content"));
  });
});
