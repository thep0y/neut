import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableFooter } from "~/components/table/TableFooter/TableFooter";

/** TableFooter：`data-slot="table-footer"` 的 tfoot。 */
describe("TableFooter", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableFooter>内容</TableFooter>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-footer"]');

    expect(element?.tagName).toBe("TFOOT");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableFooter class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-footer"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableFooter id="x" data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-footer"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
  });
});
