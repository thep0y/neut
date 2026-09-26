import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableProps } from "./Table.types";

/** 表格根：外层包裹可横向滚动的容器，内层是真正的 <table> */
export function Table(props: TableProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <div data-slot="table-container" class="relative w-full overflow-x-auto">
      <table
        {...rest}
        data-slot="table"
        class={clsx("w-full caption-bottom text-sm", local.class)}
        classList={local.classList}
      />
    </div>
  );
}
