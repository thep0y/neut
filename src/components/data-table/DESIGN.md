# Data Table 设计方案(自研 Solid 引擎)

> 状态:**P1 已实现**(表原语 + 引擎 + payments 示例)
> 目标:对齐 shadcn Data Table 的**呈现与用法**,但不依赖 TanStack,充分发挥 Solid
> 关联代码:`src/components/table/`(原语)、`src/components/data-table/`(引擎)

## 1. 背景

shadcn 的 Data Table 不是组件,而是一篇「用 `Table` 原语 + TanStack Table 自己搭」的指南。
本仓库不引入 TanStack,改为**自研 Solid 表格引擎** `createTable`,API 覆盖指南里用到的
那部分(`getHeaderGroups / getRowModel / getColumn / toggleSorting / getIsSorted /
getFilteredRowModel / getFilteredSelectedRowModel / previousPage / nextPage / getPageCount /
state.pagination` 等),使指南代码基本可以照搬。

## 2. 文件结构与 SRP

`Table` 原语**一个部件一个目录**(与 `breadcrumb`/`field` 一致):

```
src/components/table/
├── index.ts
├── Table/{Table.tsx, Table.types.ts, index.ts}
├── TableHeader/…  TableBody/…  TableFooter/…  TableRow/…
├── TableHead/…    TableCell/…  TableCaption/…
```

引擎按职责拆分,`createTable.ts` 只做组装:

| 关注点 | 文件 | 职责 |
| --- | --- | --- |
| 类型契约 | `data-table.types.ts` | ColumnDef / Column / Row / Cell / Header / DataTable / state 类型 |
| 纯工具 | `data-table.utils.ts` | 默认比较、默认过滤 |
| 状态切片 | `createTableState.ts` | 排序/过滤/显隐/选择/分页 signal + setter + onChange |
| 列 | `createTableColumns.ts` | 列对象 + accessor/comparator/filterFn 的按 id 映射 + 可见列 |
| 行 | `createTableRows.ts` | Row 构建与缓存、单元格渲染 |
| 行模型 | `createRowModel.ts` | core→filtered→sorted→page 记忆化流水线 + 页码收敛 |
| 选择 | `createTableSelection.ts` | 全选/半选/批量切换 |
| 表头 | `createTableHeaders.ts` | 表头分组与 header 渲染 |
| 组装 | `createTable.ts` | 拼装 DataTable API、组装 `state` getter |

dev:`dev/examples/data-table.tsx`(payments 示例)。

## 3. 引擎设计(性能取向)

- **记忆化流水线**:`coreRows → filteredRows → sortedRows → pageRows` 全部用 `createMemo`。
  任何一环变化只重算后续,例如改选中状态不会触发排序/过滤重算。
- **行对象身份稳定**:Row 按 id 缓存在 Map 中,数据未变时复用同一对象;配合 Solid 的
  `<For>`(按引用复用节点),排序只搬动 DOM,不重建行。
- **状态与渲染解耦**:选中态存于 signal,`row.getIsSelected()` 读取;切换选中不会重建行。
- **列对象缓存**:column 一次构建,方法读取 signal。
- 未做虚拟化(后续),但流水线 + 身份稳定已避免 vdom 式的整表 diff。

## 4. API

```ts
const table = createTable<Payment>({
  columns,
  data: () => payments,       // Solid 惯用法:传 accessor
  getRowId: (row) => row.id,
});
```

- `ColumnDef<T>`:`id` / `accessorKey` / `accessorFn` / `header` / `cell` /
  `enableSorting` / `enableHiding` / `enableColumnFilter` / `filterFn` / `sortingFn` / `meta`。
- `table.getRowModel().rows[i]`:`original` / `id` / `getValue(id)` / `getIsSelected()` /
  `toggleSelected(v?)` / `getVisibleCells()`。
- `cell.render()` / `header.render()` 负责渲染(等价 flexRender)。
- `table.state.sorting/columnFilters/columnVisibility/rowSelection/pagination` 以 getter 暴露。
- 受控观察:`onSortingChange` / `onColumnFiltersChange` / `onColumnVisibilityChange` /
  `onRowSelectionChange` / `onPaginationChange`。

## 5. 复用

`Table*` 原语、`DropdownMenu`(行操作 / 列显隐)、`Checkbox`、`Input`、`Select`、`Button`、`Badge`。

## 6. 与 shadcn/TanStack 的差异(有意为之)

- 不引入 `@tanstack/*`;用 `createTable` 而非 `useTable`、无 `tableFeatures()` 概念。
- `data` 传 accessor(Solid),不是普通数组;`columns` 用普通对象,无 `createColumnHelper`。
- `Checkbox` 用仓库既有 API(`checked` + `onChange(boolean)`),非 `onCheckedChange`;
  暂无 `indeterminate`。
- `SelectContent` 用 `placement`(非 `side`)。

## 7. 后续待实现

- 虚拟化(大行数)、列固定 / 列宽 / 列分组、可编辑单元格。
- faceted 过滤(多选过滤)、全局过滤、服务端(手动)分页/排序。
- `createColumnHelper`、`flexRender` 独立函数、受控 state 切片。
- `indeterminate` 头部勾选;`Table` 的 caption 语义补全。
- 引擎纯函数单测(过滤/排序/分页/选择)、a11y 走查。
