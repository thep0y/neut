import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { createTable } from "~/components/data-table/createTable";
import type {
  ColumnDef,
  DataTable,
} from "~/components/data-table/data-table.types";

interface Person {
  name: string;
  age: number;
}

const columns: ColumnDef<Person>[] = [
  { id: "name", accessorKey: "name" },
  { id: "age", accessorKey: "age" },
];

const people: Person[] = [
  { name: "b", age: 30 },
  { name: "a", age: 20 },
  { name: "c", age: 10 },
];

/** 整机：状态 → 列 → 行 → 流水线 → 选择 → 表头 串起来的对外行为 */
function setup(
  initial: Person[] = people,
  options: { getRowId?: (row: Person, i: number) => string } = {},
) {
  const { result } = renderHook(() => {
    const [data, setData] = createSignal(initial);
    const table = createTable<Person>({
      data,
      columns,
      getRowId: options.getRowId,
    });
    return { table, setData };
  });
  return result;
}

describe("createTable - 基本模型", () => {
  it("默认分页 10 条，能拿到行模型与列", () => {
    const result = setup();

    expect(
      result.table.getRowModel().rows.map((row) => row.original.name),
    ).toEqual(["b", "a", "c"]);
    expect(result.table.getAllColumns().map((column) => column.id)).toEqual([
      "name",
      "age",
    ]);
    expect(result.table.state.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it("表头行由可见列构建", () => {
    const result = setup();

    expect(result.table.getHeaderGroups()[0]?.headers.map((h) => h.id)).toEqual(
      ["name", "age"],
    );
  });

  it("函数式表头拿到的是最终 table 实例（可用于排序按钮等）", () => {
    const { result } = renderHook(() => {
      const [data] = createSignal(people);
      // 显式标注类型：表头回调里会引用 table 自身，否则类型推断成循环
      const table: DataTable<Person> = createTable<Person>({
        data,
        columns: [
          {
            id: "name",
            accessorKey: "name",
            header: (ctx): string =>
              ctx.table === table
                ? `排序:${String(ctx.column.getIsSorted())}`
                : "错",
          },
        ],
      });
      return table;
    });

    const header = result.getHeaderGroups()[0]?.headers[0];
    expect(header?.render()).toBe("排序:false");

    // 表头渲染函数能驱动排序（依赖 getTable 返回最终实例）
    result.getColumn("name")?.toggleSorting();
    expect(header?.render()).toBe("排序:asc");
  });

  it("数据变化时行模型跟着变", () => {
    const result = setup();

    result.setData([{ name: "z", age: 1 }]);

    expect(
      result.table.getRowModel().rows.map((row) => row.original.name),
    ).toEqual(["z"]);
  });
});

describe("createTable - 排序与过滤联动", () => {
  it("列排序影响行模型顺序", () => {
    const result = setup();

    result.table.getColumn("age")?.toggleSorting();
    expect(
      result.table.getRowModel().rows.map((row) => row.original.age),
    ).toEqual([10, 20, 30]);

    result.table.getColumn("age")?.toggleSorting();
    expect(
      result.table.getRowModel().rows.map((row) => row.original.age),
    ).toEqual([30, 20, 10]);
  });

  it("过滤同时影响 filtered 与 page 两个模型", () => {
    const result = setup();

    result.table.getColumn("name")?.setFilterValue("a");

    expect(
      result.table.getFilteredRowModel().rows.map((row) => row.original.name),
    ).toEqual(["a"]);
    expect(
      result.table.getRowModel().rows.map((row) => row.original.name),
    ).toEqual(["a"]);
    expect(result.table.state.columnFilters).toEqual([
      { id: "name", value: "a" },
    ]);
  });

  it("列隐藏后不再出现在行模型的单元格里，但仍在 allColumns 里", () => {
    const result = setup();

    result.table.getColumn("age")?.toggleVisibility(false);

    expect(result.table.getAllColumns().map((column) => column.id)).toEqual([
      "name",
      "age",
    ]);
    expect(
      result.table
        .getRowModel()
        .rows[0]?.getVisibleCells()
        .map((cell) => cell.id),
    ).toEqual(["0:name"]);
  });
});

describe("createTable - 分页命令", () => {
  it("getCanPreviousPage / getCanNextPage 反映边界", () => {
    const result = setup();
    result.table.setPageSize(2);

    expect(result.table.getPageCount()).toBe(2);
    expect(result.table.state.pagination.pageIndex).toBe(0);
    expect(result.table.getCanPreviousPage()).toBe(false);
    expect(result.table.getCanNextPage()).toBe(true);

    result.table.nextPage();
    expect(result.table.state.pagination.pageIndex).toBe(1);
    expect(result.table.getCanPreviousPage()).toBe(true);
    expect(result.table.getCanNextPage()).toBe(false);
  });

  it("previousPage 正常回退一页", () => {
    const result = setup();
    result.table.setPageSize(2);
    result.table.nextPage();
    expect(result.table.state.pagination.pageIndex).toBe(1);

    result.table.previousPage();

    expect(result.table.state.pagination.pageIndex).toBe(0);
  });

  it("previousPage / nextPage 到边界后不再越界", () => {
    const result = setup();
    result.table.setPageSize(2);

    result.table.previousPage();
    expect(result.table.state.pagination.pageIndex).toBe(0);

    result.table.nextPage();
    result.table.nextPage();
    expect(result.table.state.pagination.pageIndex).toBe(1);
  });

  it("setPageIndex 会被夹到合法范围", () => {
    const result = setup();
    result.table.setPageSize(2);

    result.table.setPageIndex(5);
    expect(result.table.state.pagination.pageIndex).toBe(1);

    result.table.setPageIndex(-3);
    expect(result.table.state.pagination.pageIndex).toBe(0);
  });

  it("setPageSize 重置回第一页，且至少为 1", () => {
    const result = setup();
    result.table.setPageSize(2);
    result.table.nextPage();

    result.table.setPageSize(1);
    expect(result.table.state.pagination).toEqual({
      pageIndex: 0,
      pageSize: 1,
    });

    result.table.setPageSize(0);
    expect(result.table.state.pagination.pageSize).toBe(1);
  });
});

describe("createTable - 选择", () => {
  it("全选/半选/取消作用于当前页", () => {
    const result = setup();
    result.table.setPageSize(2);

    expect(result.table.getIsAllPageRowsSelected()).toBe(false);
    expect(result.table.getIsSomePageRowsSelected()).toBe(false);

    result.table.toggleAllPageRowsSelected();
    expect(result.table.getIsAllPageRowsSelected()).toBe(true);
    expect(result.table.getIsSomePageRowsSelected()).toBe(false);

    result.table.getRowModel().rows[0]?.toggleSelected(false);
    expect(result.table.getIsAllPageRowsSelected()).toBe(false);
    expect(result.table.getIsSomePageRowsSelected()).toBe(true);

    result.table.toggleAllPageRowsSelected(false);
    expect(result.table.state.rowSelection).toEqual({ "0": false, "1": false });
  });

  it("getFilteredSelectedRowModel 只给出被过滤后仍选中且可见的行", () => {
    const result = setup();
    result.table.getColumn("name")?.setFilterValue("b");
    result.table.getRowModel().rows[0]?.toggleSelected(true);

    expect(
      result.table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.name),
    ).toEqual(["b"]);

    result.table.getColumn("name")?.setFilterValue("a");
    expect(result.table.getFilteredSelectedRowModel().rows).toHaveLength(0);
  });

  it("选中态变化会透出到 state.rowSelection", () => {
    const result = setup();

    result.table.getRowModel().rows[1]?.toggleSelected();

    expect(result.table.state.rowSelection).toEqual({ "1": true });
  });
});

describe("createTable - state 与回调", () => {
  it("state 的五个切片都是读取当前值（不是快照）", () => {
    const { result } = renderHook(() => {
      const [data] = createSignal(people);
      const changes: string[] = [];
      const table = createTable<Person>({
        data,
        columns,
        onSortingChange: () => changes.push("sorting"),
        onColumnFiltersChange: () => changes.push("filters"),
        onColumnVisibilityChange: () => changes.push("visibility"),
        onRowSelectionChange: () => changes.push("selection"),
        onPaginationChange: () => changes.push("pagination"),
      });
      return { table, changes };
    });

    result.table.getColumn("name")?.toggleSorting();
    // 过滤值要能命中行，否则 pageRows 为空、拿不到行去切换选中
    result.table.getColumn("name")?.setFilterValue("b");
    result.table.getColumn("age")?.toggleVisibility(false);
    result.table.getRowModel().rows[0]?.toggleSelected();
    result.table.setPageSize(5);

    expect(result.changes).toEqual([
      "sorting",
      "filters",
      "visibility",
      "selection",
      "pagination",
    ]);
    expect(result.table.state.sorting).toEqual([{ id: "name", desc: false }]);
    expect(result.table.state.columnFilters).toEqual([
      { id: "name", value: "b" },
    ]);
    expect(result.table.state.columnVisibility).toEqual({ age: false });
    expect(result.table.state.rowSelection).toEqual({ "0": true });
    expect(result.table.state.pagination).toEqual({
      pageIndex: 0,
      pageSize: 5,
    });
  });

  it("getRowId 决定行 id 与选择键", () => {
    const result = setup(people, { getRowId: (row) => row.name });

    expect(result.table.getRowModel().rows.map((row) => row.id)).toEqual([
      "b",
      "a",
      "c",
    ]);

    result.table.getRowModel().rows[0]?.toggleSelected();
    expect(result.table.state.rowSelection).toEqual({ b: true });
  });

  it("首次渲染时触发的 onChange 会被记录（initialState 不触发回调）", () => {
    const onPaginationChange = vi.fn();
    const { result } = renderHook(() => {
      const [data] = createSignal(people);
      return createTable<Person>({ data, columns, onPaginationChange });
    });

    expect(onPaginationChange).not.toHaveBeenCalled();

    result.setPageIndex(0);
    expect(onPaginationChange).toHaveBeenCalled();
  });
});
