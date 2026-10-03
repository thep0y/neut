import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableRow } from "~/components/table/TableRow/TableRow";

/** TableRow：`data-slot="table-row"` 的 tr。 */
describe("TableRow", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableRow>内容</TableRow>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-row"]');

    expect(element?.tagName).toBe("TR");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableRow class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-row"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableRow id="x" data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-row"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
  });
});
