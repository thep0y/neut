import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { TableCaption } from "~/components/table/TableCaption/TableCaption";

/** TableCaption：`data-slot="table-caption"` 的 caption。 */
describe("TableCaption", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => (
      <table>
        <TableCaption>内容</TableCaption>
      </table>
    ));
    const element = container.querySelector('[data-slot="table-caption"]');

    expect(element?.tagName).toBe("CAPTION");
    expect(element?.textContent).toBe("内容");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <table>
        <TableCaption class="my-class" classList={{ "is-on": true }} />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-caption"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <table>
        <TableCaption id="x" data-custom="1" />
      </table>
    ));
    const element = container.querySelector('[data-slot="table-caption"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("data-custom")).toBe("1");
  });
});
