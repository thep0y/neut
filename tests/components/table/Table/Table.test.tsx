import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Table } from "~/components/table/Table/Table";

/** Table：滚动容器 + table 两层结构（容器负责横向滚动）。 */
describe("Table", () => {
  it("渲染 table-container 与 table 两层", () => {
    const { container } = render(() => <Table />);
    const wrapper = container.querySelector('[data-slot="table-container"]');
    const table = container.querySelector('[data-slot="table"]');

    expect(wrapper?.tagName).toBe("DIV");
    expect(table?.tagName).toBe("TABLE");
    expect(wrapper?.contains(table!)).toBe(true);
    expect(wrapper?.className).toContain("overflow-x-auto");
  });

  it("class 与 classList 落在 table 上，容器样式不受影响", () => {
    const { container } = render(() => (
      <Table class="my-table" classList={{ "is-bordered": true }} />
    ));
    const table = container.querySelector('[data-slot="table"]')!;

    expect(table.className).toContain("my-table");
    expect(table.className).toContain("is-bordered");
  });

  it("透传其余属性并渲染 children", () => {
    const { container } = render(() => (
      <Table id="t">
        <tbody>
          <tr data-testid="row" />
        </tbody>
      </Table>
    ));

    expect(container.querySelector('[data-slot="table"]')?.id).toBe("t");
    expect(container.querySelector('[data-testid="row"]')).not.toBeNull();
  });
});
