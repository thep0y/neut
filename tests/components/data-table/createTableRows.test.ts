import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { createTableRows } from "~/components/data-table/createTableRows";
import { createTableState } from "~/components/data-table/createTableState";
import { createTableColumns } from "~/components/data-table/createTableColumns";
import type { ColumnDef } from "~/components/data-table/data-table.types";

interface Person {
  name: string;
  age: number;
}

const columns: ColumnDef<Person>[] = [
  { id: "name", accessorKey: "name" },
  { id: "age", accessorKey: "age" },
];

/**
 * 行对象构建与缓存：Row 身份稳定（<For> 才能复用 DOM）、选中态走状态读取、
 * 单元格按可见列实时生成。
 */
function setup(
  initial: Person[],
  options: { getRowId?: (row: Person, index: number) => string } = {},
) {
  const { result } = renderHook(() => {
    const [data, setData] = createSignal(initial);
    const state = createTableState<Person>({ data, columns });
    const columnApi = createTableColumns<Person>({ columns, state });
    const rows = createTableRows<Person>({
      data,
      getRowId: options.getRowId,
      getAccessor: columnApi.getAccessor,
      getVisibleColumns: columnApi.visibleColumns,
      state,
    });
    return { rows, state, columnApi, setData };
  });
  return result;
}

describe("createTableRows - 标识与缓存", () => {
  it("默认用下标作为行 id", () => {
    const result = setup([{ name: "a", age: 1 }]);

    expect(result.rows.coreRows().map((row) => row.id)).toEqual(["0"]);
  });

  it("getRowId 可以自定义 id", () => {
    const result = setup([{ name: "a", age: 1 }], {
      getRowId: (row) => row.name,
    });

    expect(result.rows.coreRows()[0]?.id).toBe("a");
  });

  it("同一份数据重复读取时行对象身份稳定", () => {
    const result = setup([{ name: "a", age: 1 }]);

    const first = result.rows.coreRows()[0];
    const again = result.rows.coreRows()[0];

    expect(again).toBe(first);
  });

  it("数据整体变化后会重建行对象", () => {
    const result = setup([{ name: "a", age: 1 }]);
    const before = result.rows.coreRows()[0];

    result.setData([{ name: "a", age: 2 }]);

    expect(result.rows.coreRows()[0]).not.toBe(before);
    expect(result.rows.coreRows()[0]?.original.age).toBe(2);
  });

  it("行被移除后缓存里不再保留它（用稳定 id 验证淘汰）", () => {
    const a = { name: "a", age: 1 };
    const b = { name: "b", age: 2 };
    const result = setup([a, b], { getRowId: (row) => row.name });
    const rowA = result.rows.coreRows()[0]!;
    const rowB = result.rows.coreRows()[1]!;

    // 移除 a：缓存里应淘汰 "a"
    result.setData([b]);
    expect(result.rows.coreRows().map((row) => row.id)).toEqual(["b"]);
    // b 没动，身份保持
    expect(result.rows.coreRows()[0]).toBe(rowB);

    // a 回来（同一个对象）：因为缓存已淘汰，必须重建
    result.setData([b, a]);
    expect(result.rows.coreRows().map((row) => row.id)).toEqual(["b", "a"]);
    expect(result.rows.coreRows()[1]).not.toBe(rowA);
    expect(result.rows.coreRows()[1]?.original).toBe(a);
  });

  it("同 id 但 original 变化时重建（缓存不会串数据）", () => {
    const result = setup([{ name: "a", age: 1 }], {
      getRowId: () => "fixed",
    });
    const before = result.rows.coreRows()[0];

    result.setData([{ name: "a", age: 99 }]);

    expect(result.rows.coreRows()[0]).not.toBe(before);
    expect(result.rows.coreRows()[0]?.original.age).toBe(99);
  });
});

describe("createTableRows - 取值与选中", () => {
  it("getValue 用列访问器取值", () => {
    const result = setup([{ name: "a", age: 7 }]);
    const row = result.rows.coreRows()[0]!;

    expect(row.getValue("name")).toBe("a");
    expect(row.getValue("age")).toBe(7);
    expect(row.getValue("unknown")).toBeUndefined();
  });

  it("默认未选中；toggleSelected 不传值取反；传值按值设置", () => {
    const result = setup([{ name: "a", age: 1 }]);
    const row = result.rows.coreRows()[0]!;

    expect(row.getIsSelected()).toBe(false);

    row.toggleSelected();
    expect(row.getIsSelected()).toBe(true);
    expect(result.state.rowSelection()).toEqual({ "0": true });

    row.toggleSelected();
    expect(row.getIsSelected()).toBe(false);

    row.toggleSelected(true);
    expect(row.getIsSelected()).toBe(true);
  });

  it("选中态只按 id 记录，不重建行对象", () => {
    const result = setup([{ name: "a", age: 1 }]);
    const row = result.rows.coreRows()[0]!;

    row.toggleSelected();

    expect(result.rows.coreRows()[0]).toBe(row);
  });

  it("默认下标 id 时选中态跟着**位置**走（换数据也仍选中）", () => {
    const result = setup([{ name: "a", age: 1 }]);
    result.rows.coreRows()[0]?.toggleSelected();

    result.setData([{ name: "b", age: 2 }]);

    // id 仍是 "0"，因此新行继承了该位置的选中态——这是"用下标做 id"的代价，
    // 需要按内容区分时请传 getRowId
    expect(result.state.rowSelection()).toEqual({ "0": true });
    expect(result.rows.coreRows()[0]?.getIsSelected()).toBe(true);
  });

  it("自定义 getRowId 时，换数据后新行不会被旧 id 的选中态命中", () => {
    const result = setup([{ name: "a", age: 1 }], {
      getRowId: (row) => row.name,
    });
    result.rows.coreRows()[0]?.toggleSelected();
    expect(result.state.rowSelection()).toEqual({ a: true });

    result.setData([{ name: "b", age: 2 }]);

    expect(result.rows.coreRows()[0]?.id).toBe("b");
    expect(result.rows.coreRows()[0]?.getIsSelected()).toBe(false);
  });
});

describe("createTableRows - 单元格", () => {
  it("只包含可见列，id 形如 rowId:columnId", () => {
    const result = setup([{ name: "a", age: 1 }]);
    result.state.setColumnVisibility({ age: false });
    const row = result.rows.coreRows()[0]!;

    expect(row.getVisibleCells().map((cell) => cell.id)).toEqual(["0:name"]);
    expect(row.getVisibleCells()[0]?.column.id).toBe("name");
    expect(row.getVisibleCells()[0]?.row).toBe(row);
  });

  it("没有 cell 渲染函数时：null/undefined 渲染 null，其它转字符串", () => {
    const result = setup([{ name: "a", age: 1 }]);
    const row = result.rows.coreRows()[0]!;
    const cells = row.getVisibleCells();

    expect(cells[0]?.render()).toBe("a");
    expect(cells[0]?.getValue()).toBe("a");
  });

  it("有 cell 渲染函数时用上下文调用（可拿到 row / column / getValue）", () => {
    const columnsWithCell: ColumnDef<Person>[] = [
      {
        id: "name",
        accessorKey: "name",
        cell: (ctx) => `${ctx.row.id}-${ctx.column.id}-${ctx.getValue()}`,
      },
    ];
    const { result } = renderHook(() => {
      const [data] = createSignal([{ name: "a", age: 1 }]);
      const state = createTableState<Person>({
        data,
        columns: columnsWithCell,
      });
      const columnApi = createTableColumns<Person>({
        columns: columnsWithCell,
        state,
      });
      const rows = createTableRows<Person>({
        data,
        getAccessor: columnApi.getAccessor,
        getVisibleColumns: columnApi.visibleColumns,
        state,
      });
      return rows;
    });

    const cell = result.coreRows()[0]!.getVisibleCells()[0]!;
    expect(cell.render()).toBe("0-name-a");
  });

  it("值为 null 且没有 cell 函数时渲染 null（而不是字符串 null）", () => {
    const nullable: ColumnDef<Person>[] = [
      { id: "name", accessorFn: () => null },
    ];
    const { result } = renderHook(() => {
      const [data] = createSignal([{ name: "a", age: 1 }]);
      const state = createTableState<Person>({ data, columns: nullable });
      const columnApi = createTableColumns<Person>({
        columns: nullable,
        state,
      });
      const rows = createTableRows<Person>({
        data,
        getAccessor: columnApi.getAccessor,
        getVisibleColumns: columnApi.visibleColumns,
        state,
      });
      return rows;
    });

    const cell = result.coreRows()[0]!.getVisibleCells()[0]!;
    expect(cell.render()).toBeNull();
  });

  it("列被隐藏后单元格不再生成（可见列是响应式的）", () => {
    const result = setup([{ name: "a", age: 1 }]);
    const row = result.rows.coreRows()[0]!;

    expect(row.getVisibleCells()).toHaveLength(2);

    result.state.setColumnVisibility({ age: false });
    expect(row.getVisibleCells()).toHaveLength(1);
  });
});
