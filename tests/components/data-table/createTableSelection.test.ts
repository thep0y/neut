import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { createTableSelection } from "~/components/data-table/createTableSelection";
import { createTableState } from "~/components/data-table/createTableState";
import type { Row } from "~/components/data-table/data-table.types";

/** 行选择只作用于**当前页**：全选/半选/批量切换都按 pageRows 判定。 */
function row(id: string, selected: boolean): Row<unknown> {
  return {
    id,
    original: { id },
    getValue: () => undefined,
    getIsSelected: () => selected,
    toggleSelected: vi.fn(),
    getVisibleCells: () => [],
  };
}

function setup(rows: Row<unknown>[], selection: Record<string, boolean> = {}) {
  const { result } = renderHook(() => {
    const state = createTableState<unknown>({
      data: () => [],
      columns: [],
      initialState: { rowSelection: selection },
    });
    const selectionApi = createTableSelection({
      pageRows: () => rows,
      state,
    });
    return { state, selection: selectionApi };
  });
  return result;
}

describe("createTableSelection - 判定", () => {
  it("空页既不是全选也不是半选", () => {
    const result = setup([]);

    expect(result.selection.getIsAllPageRowsSelected()).toBe(false);
    expect(result.selection.getIsSomePageRowsSelected()).toBe(false);
  });

  it("全部选中时是全选、不是半选", () => {
    const result = setup([row("0", true), row("1", true)]);

    expect(result.selection.getIsAllPageRowsSelected()).toBe(true);
    expect(result.selection.getIsSomePageRowsSelected()).toBe(false);
  });

  it("部分选中时是半选、不是全选", () => {
    const result = setup([row("0", true), row("1", false)]);

    expect(result.selection.getIsAllPageRowsSelected()).toBe(false);
    expect(result.selection.getIsSomePageRowsSelected()).toBe(true);
  });

  it("全都没选时两者都是 false", () => {
    const result = setup([row("0", false), row("1", false)]);

    expect(result.selection.getIsAllPageRowsSelected()).toBe(false);
    expect(result.selection.getIsSomePageRowsSelected()).toBe(false);
  });
});

describe("createTableSelection - 批量切换", () => {
  it("未全选时默认全选当前页，并保留其它页的选中态", () => {
    const result = setup([row("0", false), row("1", true)], { "9": true });

    result.selection.toggleAllPageRowsSelected();

    expect(result.state.rowSelection()).toEqual({
      "9": true,
      "0": true,
      "1": true,
    });
  });

  it("已全选时默认取消当前页", () => {
    const result = setup([row("0", true), row("1", true)]);

    result.selection.toggleAllPageRowsSelected();

    expect(result.state.rowSelection()).toEqual({ "0": false, "1": false });
  });

  it("显式传 true / false 时按值设置", () => {
    const select = setup([row("0", false)]);
    select.selection.toggleAllPageRowsSelected(true);
    expect(select.state.rowSelection()).toEqual({ "0": true });

    const clear = setup([row("0", true)]);
    clear.selection.toggleAllPageRowsSelected(false);
    expect(clear.state.rowSelection()).toEqual({ "0": false });
  });
});
