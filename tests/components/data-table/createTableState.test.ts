import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { createTableState } from "~/components/data-table/createTableState";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "~/components/data-table/data-table.types";

/**
 * 状态切片：每个 setter 都要"写内部 signal + 转发 onChange"，
 * 且初始值要么来自 initialState，要么走内置默认。
 */
/** 状态切片本身不关心数据与列，但 CreateTableOptions 要求它们存在 */
const base = { data: () => [], columns: [] };

describe("createTableState - 初始值", () => {
  it("没有 initialState 时给内置默认", () => {
    const { result } = renderHook(() => createTableState({ ...base }));

    expect(result.sorting()).toEqual([]);
    expect(result.columnFilters()).toEqual([]);
    expect(result.columnVisibility()).toEqual({});
    expect(result.rowSelection()).toEqual({});
    expect(result.pagination()).toEqual({ pageIndex: 0, pageSize: 10 });
  });

  it("initialState 的各切片都会被采用（含空对象兜底）", () => {
    const { result } = renderHook(() =>
      createTableState({
        ...base,
        initialState: {
          sorting: [{ id: "name", desc: true }],
          columnFilters: [{ id: "city", value: "上海" }],
          columnVisibility: { age: false },
          rowSelection: { "0": true },
          pagination: { pageIndex: 2, pageSize: 5 },
        },
      }),
    );

    expect(result.sorting()).toEqual([{ id: "name", desc: true }]);
    expect(result.columnFilters()).toEqual([{ id: "city", value: "上海" }]);
    expect(result.columnVisibility()).toEqual({ age: false });
    expect(result.rowSelection()).toEqual({ "0": true });
    expect(result.pagination()).toEqual({ pageIndex: 2, pageSize: 5 });
  });
});

describe("createTableState - setter 与 onChange", () => {
  const sorting: SortingState = [{ id: "a", desc: false }];
  const filters: ColumnFiltersState = [{ id: "b", value: 1 }];
  const selection: RowSelectionState = { "1": true };
  const pagination: PaginationState = { pageIndex: 1, pageSize: 20 };

  it("每个切片都会更新自身并转发 onChange", () => {
    const onSortingChange = vi.fn();
    const onColumnFiltersChange = vi.fn();
    const onColumnVisibilityChange = vi.fn();
    const onRowSelectionChange = vi.fn();
    const onPaginationChange = vi.fn();
    const { result } = renderHook(() =>
      createTableState({
        ...base,
        onSortingChange,
        onColumnFiltersChange,
        onColumnVisibilityChange,
        onRowSelectionChange,
        onPaginationChange,
      }),
    );

    result.setSorting(sorting);
    result.setColumnFilters(filters);
    result.setColumnVisibility({ a: false });
    result.setRowSelection(selection);
    result.setPagination(pagination);

    expect(result.sorting()).toEqual(sorting);
    expect(result.columnFilters()).toEqual(filters);
    expect(result.columnVisibility()).toEqual({ a: false });
    expect(result.rowSelection()).toEqual(selection);
    expect(result.pagination()).toEqual(pagination);

    expect(onSortingChange).toHaveBeenCalledWith(sorting);
    expect(onColumnFiltersChange).toHaveBeenCalledWith(filters);
    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ a: false });
    expect(onRowSelectionChange).toHaveBeenCalledWith(selection);
    expect(onPaginationChange).toHaveBeenCalledWith(pagination);
  });

  it("没有传 onChange 时 setter 仍然可用", () => {
    const { result } = renderHook(() => createTableState({ ...base }));

    expect(() => {
      result.setSorting(sorting);
      result.setColumnFilters(filters);
      result.setColumnVisibility({ x: true });
      result.setRowSelection(selection);
      result.setPagination(pagination);
    }).not.toThrow();

    expect(result.sorting()).toEqual(sorting);
  });
});
