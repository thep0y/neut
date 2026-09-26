import { createEffect, createMemo, type Accessor } from "solid-js";
import type { Column, Row } from "./data-table.types";
import { includesFilterValue } from "./data-table.utils";
import type { TableStateAccessors } from "./createTableState";

/**
 * 行模型流水线：core → filtered → sorted → page，逐级 createMemo。
 * 过滤/排序的实现细节（访问器、比较器、过滤函数）由外部注入。
 */
export function createRowModel<TData>(options: {
  coreRows: Accessor<Row<TData>[]>;
  state: TableStateAccessors;
  getColumn: (id: string) => Column<TData> | undefined;
  getAccessor: (id: string) => ((row: TData) => unknown) | undefined;
  getComparator: (id: string) => ((a: TData, b: TData) => number) | undefined;
  getFilterFn: (
    id: string,
  ) => ((row: TData, value: unknown) => boolean) | undefined;
}): {
  filteredRows: Accessor<Row<TData>[]>;
  sortedRows: Accessor<Row<TData>[]>;
  pageRows: Accessor<Row<TData>[]>;
  pageCount: Accessor<number>;
} {
  const { state } = options;

  const filteredRows = createMemo(() => {
    const filters = state.columnFilters();
    if (filters.length === 0) return options.coreRows();
    return options.coreRows().filter((row) =>
      filters.every((filter) => {
        const column = options.getColumn(filter.id);
        if (!column) return true;
        if (column.columnDef.enableColumnFilter === false) return true;
        const customFn = options.getFilterFn(filter.id);
        if (customFn) return customFn(row.original, filter.value);
        return includesFilterValue(
          options.getAccessor(filter.id)?.(row.original),
          filter.value,
        );
      }),
    );
  });

  const sortedRows = createMemo(() => {
    const entries = state.sorting();
    if (entries.length === 0) return filteredRows();
    const list = [...filteredRows()];
    list.sort((a, b) => {
      for (const entry of entries) {
        const comparator = options.getComparator(entry.id);
        if (!comparator) continue;
        const diff = comparator(a.original, b.original);
        if (diff !== 0) return entry.desc ? -diff : diff;
      }
      return 0;
    });
    return list;
  });

  const pageCount = createMemo(() =>
    Math.max(1, Math.ceil(filteredRows().length / state.pagination().pageSize)),
  );

  // 过滤后页数变小时把页码收敛回合法范围
  createEffect(() => {
    const count = pageCount();
    const current = state.pagination();
    if (current.pageIndex > count - 1) {
      state.setPagination({ ...current, pageIndex: count - 1 });
    }
  });

  const pageRows = createMemo(() => {
    const { pageIndex, pageSize } = state.pagination();
    const start = pageIndex * pageSize;
    return sortedRows().slice(start, start + pageSize);
  });

  return { filteredRows, sortedRows, pageRows, pageCount };
}
