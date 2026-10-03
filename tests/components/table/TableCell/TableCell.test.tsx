import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableCell } from "~/components/table/TableCell/TableCell";

/** TableCell：`data-slot="table-cell"` 的 td。 */
describe("TableCell", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableCell>内容</TableCell>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-cell"]');

    expect(element?.tagName).toBe("TD");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableCell class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-cell"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableCell id="x" colSpan={2} data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-cell"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
    expect(element?.getAttribute("colspan")).toBe("2");
  });
});
