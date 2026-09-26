import { createSignal, type Accessor } from "solid-js";
import type {
  ColumnFiltersState,
  ColumnVisibilityState,
  CreateTableOptions,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "./data-table.types";

/** 表格状态切片：内部 signal + 对外 setter（并转发 onChange） */
export interface TableStateAccessors {
  sorting: Accessor<SortingState>;
  setSorting: (state: SortingState) => void;
  columnFilters: Accessor<ColumnFiltersState>;
  setColumnFilters: (state: ColumnFiltersState) => void;
  columnVisibility: Accessor<ColumnVisibilityState>;
  setColumnVisibility: (state: ColumnVisibilityState) => void;
  rowSelection: Accessor<RowSelectionState>;
  setRowSelection: (state: RowSelectionState) => void;
  pagination: Accessor<PaginationState>;
  setPagination: (state: PaginationState) => void;
}

export function createTableState<TData>(
  options: CreateTableOptions<TData>,
): TableStateAccessors {
  const initial = options.initialState ?? {};

  const [sorting, setSortingSignal] = createSignal<SortingState>(
    initial.sorting ?? [],
  );
  const [columnFilters, setColumnFiltersSignal] =
    createSignal<ColumnFiltersState>(initial.columnFilters ?? []);
  const [columnVisibility, setColumnVisibilitySignal] =
    createSignal<ColumnVisibilityState>(initial.columnVisibility ?? {});
  const [rowSelection, setRowSelectionSignal] = createSignal<RowSelectionState>(
    initial.rowSelection ?? {},
  );
  const [pagination, setPaginationSignal] = createSignal<PaginationState>(
    initial.pagination ?? { pageIndex: 0, pageSize: 10 },
  );

  return {
    sorting,
    setSorting: (state) => {
      setSortingSignal(state);
      options.onSortingChange?.(state);
    },
    columnFilters,
    setColumnFilters: (state) => {
      setColumnFiltersSignal(state);
      options.onColumnFiltersChange?.(state);
    },
    columnVisibility,
    setColumnVisibility: (state) => {
      setColumnVisibilitySignal(state);
      options.onColumnVisibilityChange?.(state);
    },
    rowSelection,
    setRowSelection: (state) => {
      setRowSelectionSignal(state);
      options.onRowSelectionChange?.(state);
    },
    pagination,
    setPagination: (state) => {
      setPaginationSignal(state);
      options.onPaginationChange?.(state);
    },
  };
}
