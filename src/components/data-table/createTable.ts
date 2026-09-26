import { createTableColumns } from "./createTableColumns";
import { createTableHeaderGroups } from "./createTableHeaders";
import { createTableRows } from "./createTableRows";
import { createRowModel } from "./createRowModel";
import { createTableSelection } from "./createTableSelection";
import { createTableState } from "./createTableState";
import type { CreateTableOptions, DataTable } from "./data-table.types";

/**
 * 自研 Solid 表格引擎（headless，不依赖 TanStack）。
 *
 * 只负责**组装**各部分：
 * - 状态切片 `createTableState`
 * - 列 `createTableColumns`
 * - 行与缓存 `createTableRows`
 * - 行模型流水线 `createRowModel`（过滤 → 排序 → 分页）
 * - 选择 `createTableSelection`
 * - 表头 `createTableHeaderGroups`
 *
 * 性能取向：流水线全程 `createMemo`、Row/Column 身份稳定、选中态走 signal；
 * 详见同目录 DESIGN.md。
 */
export function createTable<TData>(
  options: CreateTableOptions<TData>,
): DataTable<TData> {
  const state = createTableState(options);
  const columns = createTableColumns({ columns: options.columns, state });

  const { coreRows } = createTableRows({
    data: options.data,
    getRowId: options.getRowId,
    getAccessor: columns.getAccessor,
    getVisibleColumns: columns.visibleColumns,
    state,
  });

  const { filteredRows, pageRows, pageCount } = createRowModel({
    coreRows,
    state,
    getColumn: columns.getColumn,
    getAccessor: columns.getAccessor,
    getComparator: columns.getComparator,
    getFilterFn: columns.getFilterFn,
  });

  const selection = createTableSelection({ pageRows, state });

  let table: DataTable<TData>;
  const getHeaderGroups = createTableHeaderGroups({
    visibleColumns: columns.visibleColumns,
    getTable: () => table,
  });

  table = {
    getHeaderGroups,
    getRowModel: () => ({ rows: pageRows() }),
    getFilteredRowModel: () => ({ rows: filteredRows() }),
    getFilteredSelectedRowModel: () => ({
      rows: filteredRows().filter((row) => row.getIsSelected()),
    }),
    getColumn: columns.getColumn,
    getAllColumns: () => columns.allColumns,
    getIsAllPageRowsSelected: selection.getIsAllPageRowsSelected,
    getIsSomePageRowsSelected: selection.getIsSomePageRowsSelected,
    toggleAllPageRowsSelected: selection.toggleAllPageRowsSelected,
    getCanPreviousPage: () => state.pagination().pageIndex > 0,
    getCanNextPage: () => state.pagination().pageIndex < pageCount() - 1,
    getPageCount: () => pageCount(),
    previousPage: () => {
      const current = state.pagination();
      if (current.pageIndex > 0) {
        state.setPagination({ ...current, pageIndex: current.pageIndex - 1 });
      }
    },
    nextPage: () => {
      const current = state.pagination();
      if (current.pageIndex < pageCount() - 1) {
        state.setPagination({ ...current, pageIndex: current.pageIndex + 1 });
      }
    },
    setPageIndex: (index) => {
      const clamped = Math.min(Math.max(index, 0), pageCount() - 1);
      state.setPagination({ ...state.pagination(), pageIndex: clamped });
    },
    setPageSize: (size) => {
      state.setPagination({ pageIndex: 0, pageSize: Math.max(1, size) });
    },
    state: {
      get sorting() {
        return state.sorting();
      },
      get columnFilters() {
        return state.columnFilters();
      },
      get columnVisibility() {
        return state.columnVisibility();
      },
      get rowSelection() {
        return state.rowSelection();
      },
      get pagination() {
        return state.pagination();
      },
    },
  };

  return table;
}
