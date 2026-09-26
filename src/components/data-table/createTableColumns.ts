import { createMemo, type Accessor } from "solid-js";
import type { Column, ColumnDef, FilterFn } from "./data-table.types";
import { compareValues } from "./data-table.utils";
import type { TableStateAccessors } from "./createTableState";

export interface TableColumns<TData> {
  allColumns: Column<TData>[];
  visibleColumns: Accessor<Column<TData>[]>;
  getColumn: (id: string) => Column<TData> | undefined;
  getAccessor: (id: string) => ((row: TData) => unknown) | undefined;
  getComparator: (id: string) => ((a: TData, b: TData) => number) | undefined;
  getFilterFn: (id: string) => FilterFn<TData> | undefined;
}

/**
 * 构建列对象，并把「数据访问 / 比较 / 过滤」的实现细节放到按 id 索引的 map 里，
 * 不挂在公开的 Column 上。列对象自身只负责列语义（排序、显隐、过滤值）。
 */
export function createTableColumns<TData>(options: {
  columns: ColumnDef<TData>[];
  state: TableStateAccessors;
}): TableColumns<TData> {
  const { state } = options;
  const accessors = new Map<string, (row: TData) => unknown>();
  const comparators = new Map<string, (a: TData, b: TData) => number>();
  const filterFns = new Map<string, FilterFn<TData>>();

  const allColumns: Column<TData>[] = options.columns.map((def, index) => {
    const id = def.id ?? def.accessorKey ?? String(index);
    const accessor =
      def.accessorFn ??
      ((row: TData) =>
        def.accessorKey !== undefined
          ? (row as Record<string, unknown>)[def.accessorKey]
          : undefined);
    accessors.set(id, accessor);

    if (typeof def.filterFn === "function") filterFns.set(id, def.filterFn);

    comparators.set(id, (a, b) => {
      const fn = def.sortingFn;
      if (typeof fn === "function") return fn(accessor(a), accessor(b));
      if (fn === "text") {
        return String(accessor(a) ?? "").localeCompare(
          String(accessor(b) ?? ""),
        );
      }
      return compareValues(accessor(a), accessor(b));
    });

    const column: Column<TData> = {
      id,
      columnDef: def,
      getCanSort: () => def.enableSorting !== false,
      getIsSorted: () => {
        const entry = state.sorting().find((s) => s.id === id);
        return entry ? (entry.desc ? "desc" : "asc") : false;
      },
      toggleSorting: (desc) => {
        if (def.enableSorting === false) return;
        const entry = state.sorting().find((s) => s.id === id);
        if (desc === undefined) {
          if (!entry) state.setSorting([{ id, desc: false }]);
          else if (!entry.desc) state.setSorting([{ id, desc: true }]);
          else state.setSorting([]);
          return;
        }
        state.setSorting([{ id, desc }]);
      },
      getCanHide: () => def.enableHiding !== false,
      getIsVisible: () => state.columnVisibility()[id] !== false,
      toggleVisibility: (value) => {
        if (def.enableHiding === false) return;
        const visible = state.columnVisibility()[id] !== false;
        const next = typeof value === "boolean" ? value : !visible;
        state.setColumnVisibility({ ...state.columnVisibility(), [id]: next });
      },
      getFilterValue: () =>
        state.columnFilters().find((f) => f.id === id)?.value ?? "",
      setFilterValue: (value) => {
        const others = state.columnFilters().filter((f) => f.id !== id);
        state.setColumnFilters(
          value === undefined || value === ""
            ? others
            : [...others, { id, value }],
        );
      },
    };

    return column;
  });

  const byId = new Map(allColumns.map((column) => [column.id, column]));

  const visibleColumns = createMemo(() =>
    allColumns.filter((column) => column.getIsVisible()),
  );

  return {
    allColumns,
    visibleColumns,
    getColumn: (id) => byId.get(id),
    getAccessor: (id) => accessors.get(id),
    getComparator: (id) => comparators.get(id),
    getFilterFn: (id) => filterFns.get(id),
  };
}
