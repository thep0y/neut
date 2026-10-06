import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableBody } from "~/components/table/TableBody/TableBody";

/** TableBody：`data-slot="table-body"` 的 tbody。 */
describe("TableBody", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableBody>内容</TableBody>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-body"]');

    expect(element?.tagName).toBe("TBODY");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableBody class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-body"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableBody id="x" data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-body"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
  });
});
