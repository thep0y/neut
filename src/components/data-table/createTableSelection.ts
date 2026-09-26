import type { Accessor } from "solid-js";
import type { Row } from "./data-table.types";
import type { TableStateAccessors } from "./createTableState";

/** 行选择：全选/半选判断与批量切换（作用于当前页） */
export function createTableSelection<TData>(options: {
  pageRows: Accessor<Row<TData>[]>;
  state: TableStateAccessors;
}): {
  getIsAllPageRowsSelected: () => boolean;
  getIsSomePageRowsSelected: () => boolean;
  toggleAllPageRowsSelected: (value?: boolean) => void;
} {
  const { state } = options;

  return {
    getIsAllPageRowsSelected: () => {
      const rows = options.pageRows();
      return rows.length > 0 && rows.every((row) => row.getIsSelected());
    },
    getIsSomePageRowsSelected: () => {
      const rows = options.pageRows();
      return (
        rows.some((row) => row.getIsSelected()) &&
        !rows.every((row) => row.getIsSelected())
      );
    },
    toggleAllPageRowsSelected: (value) => {
      const rows = options.pageRows();
      const target = value ?? !rows.every((row) => row.getIsSelected());
      const next = { ...state.rowSelection() };
      for (const row of rows) next[row.id] = target;
      state.setRowSelection(next);
    },
  };
}
