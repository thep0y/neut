import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { createTableHeaderGroups } from "~/components/data-table/createTableHeaders";
import type {
  Column,
  ColumnDef,
  DataTable,
} from "~/components/data-table/data-table.types";

/**
 * 表头分组：当前只有一行。`render()` 支持字符串表头、函数表头，
 * 以及没有表头时回退到列 id。
 */
function column(
  id: string,
  columnDef: ColumnDef<{ name: string }>,
): Column<{ name: string }> {
  return {
    id,
    columnDef,
    getCanSort: () => true,
    getIsSorted: () => false,
    toggleSorting: () => {},
    getCanHide: () => true,
    getIsVisible: () => true,
    toggleVisibility: () => {},
    getFilterValue: () => "",
    setFilterValue: () => {},
  };
}

function setup(defs: Array<[string, ColumnDef<{ name: string }>]>) {
  const columns = defs.map(([id, def]) => column(id, def));
  const table = { marker: true } as unknown as DataTable<{ name: string }>;

  const { result } = renderHook(() =>
    createTableHeaderGroups<{ name: string }>({
      visibleColumns: () => columns,
      getTable: () => table,
    }),
  );
  return { groups: result(), table, columns };
}

describe("createTableHeaders", () => {
  it("只有一个表头行，headers 与可见列一一对应", () => {
    const { groups, columns } = setup([
      ["name", { id: "name", header: "姓名" }],
      ["age", { id: "age", header: "年龄" }],
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("header");
    expect(groups[0]?.headers.map((header) => header.id)).toEqual([
      "name",
      "age",
    ]);
    expect(groups[0]?.headers[0]?.column).toBe(columns[0]);
    expect(groups[0]?.headers[0]?.isPlaceholder).toBe(false);
  });

  it("字符串表头直接渲染", () => {
    const { groups } = setup([["name", { id: "name", header: "姓名" }]]);

    expect(groups[0]?.headers[0]?.render()).toBe("姓名");
  });

  it("函数表头收到 { column, table } 上下文", () => {
    const { groups, table, columns } = setup([
      [
        "name",
        {
          id: "name",
          header: (ctx) =>
            ctx.table === table ? `col:${ctx.column.id}` : "wrong",
        },
      ],
    ]);

    expect(groups[0]?.headers[0]?.render()).toBe("col:name");
    expect(columns[0]?.id).toBe("name");
  });

  it("没有 header 时回退到列 id", () => {
    const { groups } = setup([
      ["name", { id: "name" }],
      ["age", {}],
    ]);

    expect(groups[0]?.headers[0]?.render()).toBe("name");
    expect(groups[0]?.headers[1]?.render()).toBe("age");
  });

  it("可见列变化时表头跟着变化（每次调用重新求值）", () => {
    const columns: Column<{ name: string }>[] = [
      column("name", { id: "name", header: "姓名" }),
      column("age", { id: "age", header: "年龄" }),
    ];
    let visible = columns;
    const { result } = renderHook(() =>
      createTableHeaderGroups<{ name: string }>({
        visibleColumns: () => visible,
        getTable: () => ({}) as DataTable<{ name: string }>,
      }),
    );

    expect(result()[0]?.headers).toHaveLength(2);

    visible = [columns[0]!];
    expect(result()[0]?.headers.map((header) => header.id)).toEqual(["name"]);
  });
});
