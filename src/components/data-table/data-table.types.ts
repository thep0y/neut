import type { Accessor, JSX } from "solid-js";

export interface SortingEntry {
  id: string;
  desc: boolean;
}
export type SortingState = SortingEntry[];

export interface ColumnFilter {
  id: string;
  value: unknown;
}
export type ColumnFiltersState = ColumnFilter[];

export type ColumnVisibilityState = Record<string, boolean>;
export type RowSelectionState = Record<string, boolean>;

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: ColumnVisibilityState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
}

export type SortingFn =
  | "auto"
  | "text"
  | "alphanumeric"
  | ((a: unknown, b: unknown) => number);
export type FilterFn<TData> = (row: TData, filterValue: unknown) => boolean;

export interface ColumnDef<TData> {
  /** 列 id；缺省用 accessorKey，再缺省用列下标注 */
  id?: string;
  accessorKey?: string;
  accessorFn?: (row: TData) => unknown;
  header?: string | ((ctx: HeaderContext<TData>) => JSX.Element);
  cell?: (ctx: CellContext<TData>) => JSX.Element;
  enableSorting?: boolean;
  enableHiding?: boolean;
  enableColumnFilter?: boolean;
  filterFn?: FilterFn<TData>;
  sortingFn?: SortingFn;
  meta?: Record<string, unknown>;
}

export interface CellContext<TData> {
  row: Row<TData>;
  column: Column<TData>;
  getValue: () => unknown;
}

export interface HeaderContext<TData> {
  column: Column<TData>;
  table: DataTable<TData>;
}

export interface Cell<TData> {
  id: string;
  column: Column<TData>;
  row: Row<TData>;
  getValue: () => unknown;
  render: () => JSX.Element;
}

export interface Header<TData> {
  id: string;
  column: Column<TData>;
  isPlaceholder: boolean;
  render: () => JSX.Element;
}

export interface HeaderGroup<TData> {
  id: string;
  headers: Header<TData>[];
}

export interface Row<TData> {
  id: string;
  original: TData;
  getValue: (columnId: string) => unknown;
  getIsSelected: () => boolean;
  toggleSelected: (value?: boolean) => void;
  getVisibleCells: () => Cell<TData>[];
}

export interface Column<TData> {
  id: string;
  columnDef: ColumnDef<TData>;
  getCanSort: () => boolean;
  getIsSorted: () => false | "asc" | "desc";
  toggleSorting: (desc?: boolean) => void;
  getCanHide: () => boolean;
  getIsVisible: () => boolean;
  toggleVisibility: (value?: boolean) => void;
  getFilterValue: () => unknown;
  setFilterValue: (value: unknown) => void;
}

export interface DataTable<TData> {
  getHeaderGroups: () => HeaderGroup<TData>[];
  getRowModel: () => { rows: Row<TData>[] };
  getFilteredRowModel: () => { rows: Row<TData>[] };
  getFilteredSelectedRowModel: () => { rows: Row<TData>[] };
  getColumn: (id: string) => Column<TData> | undefined;
  getAllColumns: () => Column<TData>[];
  getIsAllPageRowsSelected: () => boolean;
  getIsSomePageRowsSelected: () => boolean;
  toggleAllPageRowsSelected: (value?: boolean) => void;
  getCanPreviousPage: () => boolean;
  getCanNextPage: () => boolean;
  getPageCount: () => number;
  previousPage: () => void;
  nextPage: () => void;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  state: TableState;
}

export interface CreateTableOptions<TData> {
  /** 数据源(响应式 accessor，Solid 惯用法) */
  data: Accessor<TData[]>;
  columns: ColumnDef<TData>[];
  getRowId?: (row: TData, index: number) => string;
  initialState?: Partial<TableState>;
  onSortingChange?: (state: SortingState) => void;
  onColumnFiltersChange?: (state: ColumnFiltersState) => void;
  onColumnVisibilityChange?: (state: ColumnVisibilityState) => void;
  onRowSelectionChange?: (state: RowSelectionState) => void;
  onPaginationChange?: (state: PaginationState) => void;
}
