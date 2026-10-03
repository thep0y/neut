import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { createTableColumns } from "~/components/data-table/createTableColumns";
import { createTableState } from "~/components/data-table/createTableState";
import type { ColumnDef } from "~/components/data-table/data-table.types";

interface Person {
  name: string;
  age: number;
}

interface PersonExtras {
  name?: string;
  age?: number;
}

const people: Person[] = [
  { name: "b", age: 30 },
  { name: "a", age: 20 },
];

function setup(columns: ColumnDef<Person>[], initialState = {}) {
  const { result } = renderHook(() => {
    const state = createTableState<Person>({
      data: () => people,
      columns,
      initialState,
    });
    const api = createTableColumns<Person>({ columns, state });
    return { state, api };
  });
  return result;
}

const basic: ColumnDef<Person>[] = [
  { id: "name", accessorKey: "name" },
  { id: "age", accessorKey: "age" },
];

describe("createTableColumns - 列 id 与访问器", () => {
  it("id 优先取 def.id，其次 accessorKey，最后下标", () => {
    const result = setup([
      { id: "explicit", accessorKey: "name" },
      { accessorKey: "age" },
      {},
    ] as ColumnDef<Person>[]);

    expect(result.api.allColumns.map((column) => column.id)).toEqual([
      "explicit",
      "age",
      "2",
    ]);
  });

  it("默认访问器读 accessorKey 指向的字段", () => {
    const result = setup(basic);
    const accessor = result.api.getAccessor("name");

    expect(accessor?.(people[0])).toBe("b");
    expect(accessor?.(people[1])).toBe("a");
  });

  it("accessorFn 优先于 accessorKey", () => {
    const result = setup([
      {
        id: "name",
        accessorKey: "name",
        accessorFn: (row) => row.name.toUpperCase(),
      },
    ]);

    expect(result.api.getAccessor("name")?.(people[0])).toBe("B");
  });

  it("既没有 accessorKey 也没有 accessorFn 时返回 undefined", () => {
    const result = setup([{ id: "raw" }] as ColumnDef<Person>[]);

    expect(result.api.getAccessor("raw")?.(people[0])).toBeUndefined();
  });
});

describe("createTableColumns - 排序行为", () => {
  it("getCanSort 默认 true，enableSorting: false 时为 false", () => {
    const result = setup([
      { id: "name", accessorKey: "name" },
      { id: "age", accessorKey: "age", enableSorting: false },
    ]);

    expect(result.api.getColumn("name")?.getCanSort()).toBe(true);
    expect(result.api.getColumn("age")?.getCanSort()).toBe(false);
  });

  it("toggleSorting 未指定方向时按 升序 → 降序 → 清除 循环", () => {
    const result = setup(basic);
    const column = result.api.getColumn("name")!;

    expect(column.getIsSorted()).toBe(false);

    column.toggleSorting();
    expect(column.getIsSorted()).toBe("asc");
    expect(result.state.sorting()).toEqual([{ id: "name", desc: false }]);

    column.toggleSorting();
    expect(column.getIsSorted()).toBe("desc");
    expect(result.state.sorting()).toEqual([{ id: "name", desc: true }]);

    column.toggleSorting();
    expect(column.getIsSorted()).toBe(false);
    expect(result.state.sorting()).toEqual([]);
  });

  it("toggleSorting 指定方向时直接设置", () => {
    const result = setup(basic);
    const column = result.api.getColumn("name")!;

    column.toggleSorting(true);
    expect(result.state.sorting()).toEqual([{ id: "name", desc: true }]);
    expect(column.getIsSorted()).toBe("desc");

    column.toggleSorting(false);
    expect(column.getIsSorted()).toBe("asc");
  });

  it("enableSorting: false 的列 toggleSorting 不做任何事", () => {
    const result = setup([
      { id: "age", accessorKey: "age", enableSorting: false },
    ]);
    const column = result.api.getColumn("age")!;

    column.toggleSorting();
    column.toggleSorting(true);

    expect(result.state.sorting()).toEqual([]);
    expect(column.getIsSorted()).toBe(false);
  });

  it("只反映本列自己的排序状态（多列排序里各看各的）", () => {
    const result = setup(basic);
    result.state.setSorting([{ id: "age", desc: true }]);

    expect(result.api.getColumn("name")?.getIsSorted()).toBe(false);
    expect(result.api.getColumn("age")?.getIsSorted()).toBe("desc");
  });
});

describe("createTableColumns - 比较器", () => {
  it("sortingFn 为函数时以访问器的值调用它", () => {
    const sortingFn = vi.fn(
      (a: unknown, b: unknown) => (a as number) - (b as number),
    );
    const result = setup([{ id: "age", accessorKey: "age", sortingFn }]);

    result.api.getComparator("age")?.(people[0], people[1]);

    expect(sortingFn).toHaveBeenCalledWith(30, 20);
  });

  it('sortingFn 为 "text" 时按字符串比较（忽略大小写敏感性问题）', () => {
    const result = setup([
      { id: "name", accessorKey: "name", sortingFn: "text" },
    ]);

    expect(
      result.api.getComparator("name")?.(people[1], people[0]),
    ).toBeLessThan(0);
  });

  it("没有 sortingFn 时用默认比较（数字比大小）", () => {
    const result = setup([{ id: "age", accessorKey: "age" }]);

    expect(
      result.api.getComparator("age")?.(people[0], people[1]),
    ).toBeGreaterThan(0);
  });

  it("text 分支对 null 值安全", () => {
    const result = setup([
      { id: "name", accessorKey: "name", sortingFn: "text" },
    ]);

    const comparator = result.api.getComparator("name")!;
    expect(() => comparator({} as Person, {} as Person)).not.toThrow();
  });
});

describe("createTableColumns - 显隐", () => {
  it("getCanHide 默认 true，enableHiding: false 时为 false", () => {
    const result = setup([
      { id: "name", accessorKey: "name" },
      { id: "age", accessorKey: "age", enableHiding: false },
    ]);

    expect(result.api.getColumn("name")?.getCanHide()).toBe(true);
    expect(result.api.getColumn("age")?.getCanHide()).toBe(false);
  });

  it("默认可见，columnVisibility 显式为 false 时不可见", () => {
    const result = setup(basic, { columnVisibility: { age: false } });

    expect(result.api.getColumn("name")?.getIsVisible()).toBe(true);
    expect(result.api.getColumn("age")?.getIsVisible()).toBe(false);
  });

  it("visibleColumns 只含可见列且是响应式的", () => {
    const result = setup(basic);
    expect(result.api.visibleColumns().map((c) => c.id)).toEqual([
      "name",
      "age",
    ]);

    result.state.setColumnVisibility({ age: false });
    expect(result.api.visibleColumns().map((c) => c.id)).toEqual(["name"]);

    result.api.getColumn("name")?.toggleVisibility(false);
    expect(result.api.visibleColumns()).toEqual([]);
  });

  it("toggleVisibility 不传值时取反，传值时按值设置", () => {
    const result = setup(basic);
    const column = result.api.getColumn("age")!;

    column.toggleVisibility();
    expect(result.state.columnVisibility()).toEqual({ age: false });

    column.toggleVisibility();
    expect(result.state.columnVisibility()).toEqual({ age: true });

    column.toggleVisibility(false);
    expect(result.state.columnVisibility()).toEqual({ age: false });
  });

  it("enableHiding: false 的列 toggleVisibility 不做任何事", () => {
    const result = setup([
      { id: "age", accessorKey: "age", enableHiding: false },
    ]);

    result.api.getColumn("age")?.toggleVisibility(false);

    expect(result.state.columnVisibility()).toEqual({});
  });
});

describe("createTableColumns - 过滤值", () => {
  it("默认是空串；设置后读回；替换同列只保留一条", () => {
    const result = setup(basic);
    const column = result.api.getColumn("name")!;

    expect(column.getFilterValue()).toBe("");

    column.setFilterValue("a");
    expect(column.getFilterValue()).toBe("a");
    expect(result.state.columnFilters()).toEqual([{ id: "name", value: "a" }]);

    column.setFilterValue("b");
    expect(result.state.columnFilters()).toEqual([{ id: "name", value: "b" }]);
  });

  it("设置空串或 undefined 时清除该列的过滤，保留其它列", () => {
    const result = setup(basic, {
      columnFilters: [
        { id: "name", value: "a" },
        { id: "age", value: 20 },
      ],
    });
    const name = result.api.getColumn("name")!;

    name.setFilterValue("");
    expect(result.state.columnFilters()).toEqual([{ id: "age", value: 20 }]);

    result.api.getColumn("age")?.setFilterValue(undefined);
    expect(result.state.columnFilters()).toEqual([]);
  });

  it("过滤函数注册到 filterFns，非函数则不注册", () => {
    const filterFn = vi.fn(() => true);
    const result = setup([
      { id: "name", accessorKey: "name", filterFn },
      { id: "age", accessorKey: "age" },
    ]);

    expect(result.api.getFilterFn("name")).toBe(filterFn);
    expect(result.api.getFilterFn("age")).toBeUndefined();
  });
});

describe("createTableColumns - 未知列", () => {
  it("getColumn / getAccessor / getComparator 对未知 id 返回 undefined", () => {
    const result = setup(basic);

    expect(result.api.getColumn("nope")).toBeUndefined();
    expect(result.api.getAccessor("nope")).toBeUndefined();
    expect(result.api.getComparator("nope")).toBeUndefined();
  });

  it("列对象持有原始 columnDef 供渲染使用", () => {
    const def: ColumnDef<Person> = { id: "name", header: "姓名" };
    const result = setup([def]);

    expect(result.api.getColumn("name")?.columnDef).toBe(def);
  });

  it("accessorKey 存在但行上缺字段时返回 undefined（不抛错）", () => {
    const result = setup([{ id: "name", accessorKey: "name" }]);

    expect(
      result.api.getAccessor("name")?.({} as PersonExtras as Person),
    ).toBeUndefined();
  });
});
