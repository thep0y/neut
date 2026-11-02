# DataTable

自研的 Solid 表格引擎（不依赖 TanStack）。`Table` 原语负责呈现，`createTable` 负责状态与行模型。

```tsx
import {
    createTable,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@neut/ui";
import { For } from "solid-js";

const table = createTable({
    data: () => payments(),
    columns: [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "amount", header: "Amount" },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => <button>{row.original.status}</button>,
        },
    ],
    getRowId: (row) => row.id,
});

<Table>
    <TableHeader>
        <For each={table.getHeaderGroups()}>
            {(group) => (
                <TableRow>
                    <For each={group.headers}>
                        {(header) => <TableHead>{header.render()}</TableHead>}
                    </For>
                </TableRow>
            )}
        </For>
    </TableHeader>
    <TableBody>
        <For each={table.getRowModel().rows}>
            {(row) => (
                <TableRow>
                    <For each={row.getVisibleCells()}>
                        {(cell) => <TableCell>{cell.render()}</TableCell>}
                    </For>
                </TableRow>
            )}
        </For>
    </TableBody>
</Table>;
```

## createTable options

| 选项 | 类型 | 说明 |
| :--- | :--- | :--- |
| `data` | `Accessor<T[]>` | **必须传 accessor**（Solid 惯用法），不是普通数组 |
| `columns` | `ColumnDef<T>[]` | 列定义 |
| `getRowId` | `(row, index) => string` | 行 id；缺省用索引 |
| `initialState` | `Partial<TableState>` | 排序/过滤/显隐/选择/分页初始值 |
| `onSortingChange` / `onColumnFiltersChange` / `onColumnVisibilityChange` / `onRowSelectionChange` / `onPaginationChange` | — | 观察状态变化 |

`ColumnDef`：`id`、`accessorKey`、`accessorFn`、`header`、`cell`、`enableSorting`、`enableHiding`、
`enableColumnFilter`、`filterFn`、`sortingFn`、`meta`。

## 返回值

- `getHeaderGroups()` / `getRowModel()` / `getFilteredRowModel()` / `getFilteredSelectedRowModel()`
- `getColumn(id)` / `getAllColumns()`
- 选择：`getIsAllPageRowsSelected()`、`getIsSomePageRowsSelected()`、`toggleAllPageRowsSelected(value?)`
- 分页：`getCanPreviousPage()`、`getCanNextPage()`、`getPageCount()`、`previousPage()`、`nextPage()`、
  `setPageIndex(index)`、`setPageSize(size)`
- `state`：`sorting`、`columnFilters`、`columnVisibility`、`rowSelection`、`pagination`

## 性能与限制

- 行模型是 `core → filtered → sorted → page` 的记忆化流水线；选中态变化不会重算排序/过滤。
- `Row` 按 id 缓存，数据不变时复用同一对象，配合 `<For>` 只搬 DOM、不重建。
- 未实现虚拟化、列固定/列宽/列分组、可编辑单元格、faceted/global 过滤、服务端分页。
- 头部 Checkbox 暂不支持 `indeterminate`（半选用 `getIsSomePageRowsSelected` 判断后自行渲染）。

完整设计见 [DataTable DESIGN](../../src/components/data-table/DESIGN.md)。
