import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableHead } from "~/components/table/TableHead/TableHead";

/** TableHead：`data-slot="table-head"` 的 th。 */
describe("TableHead", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableHead>内容</TableHead>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-head"]');

    expect(element?.tagName).toBe("TH");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableHead class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-head"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableHead id="x" colSpan={2} data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-head"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
    expect(element?.getAttribute("colspan")).toBe("2");
  });
});
