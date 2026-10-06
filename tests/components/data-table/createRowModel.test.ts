import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { createRowModel } from "~/components/data-table/createRowModel";
import { createTableState } from "~/components/data-table/createTableState";
import type {
  Column,
  ColumnDef,
  Row,
} from "~/components/data-table/data-table.types";

interface Person {
  name: string;
  age: number;
}

/**
 * 行模型流水线 core → filtered → sorted → page。
 * 这里注入**可控的**列/访问器/比较器/过滤函数，单独验证每一级的规则。
 */
function makeRow(id: string, original: Person): Row<Person> {
  return {
    id,
    original,
    getValue: () => undefined,
    getIsSelected: () => false,
    toggleSelected: () => {},
    getVisibleCells: () => [],
  };
}

function setup(options: {
  rows: Person[];
  columnDefs?: Record<string, Partial<ColumnDef<Person>> | undefined>;
  sorting?: { id: string; desc: boolean }[];
  filters?: { id: string; value: unknown }[];
  pageSize?: number;
  pageIndex?: number;
}) {
  const { result } = renderHook(() => {
    const [data, setData] = createSignal(options.rows);
    const state = createTableState<Person>({
      data,
      columns: [],
      initialState: {
        sorting: options.sorting ?? [],
        columnFilters: options.filters ?? [],
        pagination: {
          pageIndex: options.pageIndex ?? 0,
          pageSize: options.pageSize ?? 10,
        },
      },
    });
    const defs = options.columnDefs ?? {};
    const coreRows = () =>
      data().map((original, index) => makeRow(String(index), original));
    const model = createRowModel<Person>({
      coreRows,
      state,
      getColumn: (id) =>
        id in defs
          ? ({ id, columnDef: { id, ...defs[id] } } as Column<Person>)
          : undefined,
      getAccessor: (id) => (row) =>
        (row as unknown as Record<string, unknown>)[id],
      getComparator: (id) => {
        const def = defs[id];
        if (def?.sortingFn === undefined && !(id in defs)) return undefined;
        const fn = def?.sortingFn;
        if (typeof fn === "function") {
          const compare = fn as (a: unknown, b: unknown) => number;
          return (a: Person, b: Person) =>
            compare(a[id as keyof Person], b[id as keyof Person]);
        }
        return (a, b) =>
          String(a[id as keyof Person]).localeCompare(
            String(b[id as keyof Person]),
          );
      },
      getFilterFn: (id) => {
        const fn = defs[id]?.filterFn;
        return typeof fn === "function" ? fn : undefined;
      },
    });
    return { model, state, setData };
  });
  return result;
}

const people: Person[] = [
  { name: "b", age: 30 },
  { name: "a", age: 20 },
  { name: "c", age: 10 },
];

describe("createRowModel - 过滤", () => {
  it("没有过滤条件时直接透传 coreRows", () => {
    const result = setup({ rows: people });

    expect(result.model.filteredRows().map((row) => row.original.name)).toEqual(
      ["b", "a", "c"],
    );
  });

  it("多个过滤条件之间是 AND", () => {
    const result = setup({
      rows: people,
      columnDefs: { name: {}, age: {} },
      filters: [
        { id: "name", value: "b" },
        { id: "age", value: "30" },
      ],
    });

    expect(result.model.filteredRows().map((row) => row.original.name)).toEqual(
      ["b"],
    );

    result.state.setColumnFilters([{ id: "name", value: "a" }]);
    expect(result.model.filteredRows().map((row) => row.original.name)).toEqual(
      ["a"],
    );
  });

  it("未知列的条件被忽略（不筛掉任何行）", () => {
    const result = setup({
      rows: people,
      filters: [{ id: "unknown", value: "x" }],
    });

    expect(result.model.filteredRows()).toHaveLength(3);
  });

  it("enableColumnFilter: false 的列不参与过滤", () => {
    const result = setup({
      rows: people,
      columnDefs: { name: { enableColumnFilter: false } },
      filters: [{ id: "name", value: "zzz" }],
    });

    expect(result.model.filteredRows()).toHaveLength(3);
  });

  it("自定义 filterFn 收到 (original, value)", () => {
    const filterFn = vi.fn((row: unknown, value: unknown) => {
      const person = row as Person;
      return person.age > (value as number);
    });
    const result = setup({
      rows: people,
      columnDefs: { age: { filterFn } },
      filters: [{ id: "age", value: 15 }],
    });

    expect(result.model.filteredRows().map((row) => row.original.age)).toEqual([
      30, 20,
    ]);
    expect(filterFn).toHaveBeenCalledWith(people[0], 15);
  });

  it("没有自定义 filterFn 时用默认的包含匹配（大小写不敏感）", () => {
    const result = setup({
      rows: people,
      columnDefs: { name: {} },
      filters: [{ id: "name", value: "A" }],
    });

    expect(result.model.filteredRows().map((row) => row.original.name)).toEqual(
      ["a"],
    );
  });
});

describe("createRowModel - 排序", () => {
  it("没有排序条件时透传过滤结果", () => {
    const result = setup({ rows: people, columnDefs: { name: {} } });

    expect(result.model.sortedRows().map((row) => row.original.name)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("升序 / 降序按比较器结果取反", () => {
    const asc = setup({
      rows: people,
      columnDefs: { age: {} },
      sorting: [{ id: "age", desc: false }],
    });
    expect(asc.model.sortedRows().map((row) => row.original.age)).toEqual([
      10, 20, 30,
    ]);

    const desc = setup({
      rows: people,
      columnDefs: { age: {} },
      sorting: [{ id: "age", desc: true }],
    });
    expect(desc.model.sortedRows().map((row) => row.original.age)).toEqual([
      30, 20, 10,
    ]);
  });

  it("排序只产生新数组，不改动 coreRows 的顺序", () => {
    const result = setup({
      rows: people,
      columnDefs: { age: {} },
      sorting: [{ id: "age", desc: false }],
    });

    expect(result.model.sortedRows().map((row) => row.original.age)).toEqual([
      10, 20, 30,
    ]);
    expect(result.model.filteredRows().map((row) => row.original.age)).toEqual([
      30, 20, 10,
    ]);
  });

  it("未知列的比较器被跳过，继续用下一个条件", () => {
    const result = setup({
      rows: people,
      columnDefs: { age: {} },
      sorting: [
        { id: "unknown", desc: false },
        { id: "age", desc: false },
      ],
    });

    expect(result.model.sortedRows().map((row) => row.original.age)).toEqual([
      10, 20, 30,
    ]);
  });

  it("多列排序：第一列相等时用第二列决定", () => {
    const rows: Person[] = [
      { name: "a", age: 2 },
      { name: "a", age: 1 },
      { name: "b", age: 3 },
    ];
    const result = setup({
      rows,
      columnDefs: { name: {}, age: {} },
      sorting: [
        { id: "name", desc: false },
        { id: "age", desc: false },
      ],
    });

    expect(
      result.model
        .sortedRows()
        .map((row) => [row.original.name, row.original.age]),
    ).toEqual([
      ["a", 1],
      ["a", 2],
      ["b", 3],
    ]);
  });

  it("所有条件都相等时保持原顺序（比较器返回 0）", () => {
    const rows: Person[] = [
      { name: "x", age: 1 },
      { name: "y", age: 1 },
    ];
    const result = setup({
      rows,
      columnDefs: { age: {} },
      sorting: [{ id: "age", desc: false }],
    });

    expect(result.model.sortedRows().map((row) => row.original.name)).toEqual([
      "x",
      "y",
    ]);
  });
});

describe("createRowModel - 分页", () => {
  it("pageCount 至少为 1，且按过滤后的行数计算", () => {
    expect(setup({ rows: [], pageSize: 2 }).model.pageCount()).toBe(1);
    expect(setup({ rows: people, pageSize: 2 }).model.pageCount()).toBe(2);
    expect(setup({ rows: people, pageSize: 10 }).model.pageCount()).toBe(1);
  });

  it("pageRows 按页大小切片", () => {
    const first = setup({ rows: people, pageSize: 2, pageIndex: 0 });
    expect(first.model.pageRows().map((row) => row.original.name)).toEqual([
      "b",
      "a",
    ]);

    const second = setup({ rows: people, pageSize: 2, pageIndex: 1 });
    expect(second.model.pageRows().map((row) => row.original.name)).toEqual([
      "c",
    ]);
  });

  it("分页作用于排序之后的结果", () => {
    const result = setup({
      rows: people,
      columnDefs: { age: {} },
      sorting: [{ id: "age", desc: false }],
      pageSize: 1,
      pageIndex: 0,
    });

    expect(result.model.pageRows().map((row) => row.original.age)).toEqual([
      10,
    ]);
  });

  it("过滤后页数变小时把页码收敛进合法范围", async () => {
    const result = setup({
      rows: people,
      columnDefs: { name: {} },
      pageSize: 1,
      pageIndex: 2,
    });
    expect(result.state.pagination().pageIndex).toBe(2);

    // 过滤到只剩 1 行 → pageCount 变 1 → 页码应被收敛到 0
    result.state.setColumnFilters([{ id: "name", value: "a" }]);
    await Promise.resolve();

    expect(result.model.pageCount()).toBe(1);
    expect(result.state.pagination().pageIndex).toBe(0);
  });

  it("页码本来就在范围内时不会被改写", async () => {
    const result = setup({ rows: people, pageSize: 2, pageIndex: 1 });
    const before = result.state.pagination();

    await Promise.resolve();

    expect(result.state.pagination()).toEqual(before);
  });
});
