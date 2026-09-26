import { createMemo, type Accessor } from "solid-js";
import type { Cell, CellContext, Column, Row } from "./data-table.types";
import type { TableStateAccessors } from "./createTableState";

/**
 * 行对象构建与缓存：Row 按 id 缓存、身份稳定，配合 <For> 复用 DOM；
 * 选中态通过状态读取，不因勾选而重建行。
 */
export function createTableRows<TData>(options: {
  data: Accessor<TData[]>;
  getRowId?: (row: TData, index: number) => string;
  getAccessor: (id: string) => ((row: TData) => unknown) | undefined;
  getVisibleColumns: Accessor<Column<TData>[]>;
  state: TableStateAccessors;
}): { coreRows: Accessor<Row<TData>[]> } {
  const { state } = options;
  const cache = new Map<string, Row<TData>>();

  const buildRow = (original: TData, id: string): Row<TData> => {
    const getValue = (columnId: string) =>
      options.getAccessor(columnId)?.(original);

    const row: Row<TData> = {
      id,
      original,
      getValue,
      getIsSelected: () => state.rowSelection()[id] === true,
      toggleSelected: (value) => {
        const current = state.rowSelection();
        const next = value ?? current[id] !== true;
        state.setRowSelection({ ...current, [id]: next });
      },
      getVisibleCells: () =>
        options.getVisibleColumns().map((column) => {
          const columnId = column.id;
          const cell: Cell<TData> = {
            id: `${id}:${columnId}`,
            column,
            row,
            getValue: () => getValue(columnId),
            render: () => {
              const value = getValue(columnId);
              if (column.columnDef.cell) {
                const ctx: CellContext<TData> = {
                  row,
                  column,
                  getValue: () => getValue(columnId),
                };
                return column.columnDef.cell(ctx);
              }
              return value == null ? null : String(value);
            },
          };
          return cell;
        }),
    };
    return row;
  };

  const coreRows = createMemo(() => {
    const rows = options.data();
    const seen = new Set<string>();
    const result = rows.map((original, index) => {
      const id = options.getRowId?.(original, index) ?? String(index);
      seen.add(id);
      const cached = cache.get(id);
      if (cached && cached.original === original) return cached;
      const row = buildRow(original, id);
      cache.set(id, row);
      return row;
    });
    for (const key of cache.keys()) {
      if (!seen.has(key)) cache.delete(key);
    }
    return result;
  });

  return { coreRows };
}
