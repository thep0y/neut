import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableHeader } from "~/components/table/TableHeader/TableHeader";

/** TableHeader：`data-slot="table-header"` 的 thead。 */
describe("TableHeader", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableHeader>内容</TableHeader>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-header"]');

    expect(element?.tagName).toBe("THEAD");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableHeader class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-header"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableHeader id="x" data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-header"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
  });
});
