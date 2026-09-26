import type { Accessor } from "solid-js";
import type {
  Column,
  DataTable,
  Header,
  HeaderContext,
  HeaderGroup,
} from "./data-table.types";

/**
 * 表头分组：当前只有一行（不做列分组）。
 * 通过 getTable 拿到最终 table 实例，供 header 渲染函数使用（避免循环依赖）。
 */
export function createTableHeaderGroups<TData>(options: {
  visibleColumns: Accessor<Column<TData>[]>;
  getTable: () => DataTable<TData>;
}): () => HeaderGroup<TData>[] {
  return () => {
    const headers: Header<TData>[] = options.visibleColumns().map((column) => {
      const header: Header<TData> = {
        id: column.id,
        column,
        isPlaceholder: false,
        render: () => {
          const def = column.columnDef;
          if (typeof def.header === "function") {
            const ctx: HeaderContext<TData> = {
              column,
              table: options.getTable(),
            };
            return def.header(ctx);
          }
          return def.header ?? column.id;
        },
      };
      return header;
    });
    return [{ id: "header", headers }];
  };
}
