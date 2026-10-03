import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SheetFooter } from "~/components/sheet/SheetFooter/SheetFooter";

function footer(): HTMLElement {
  return document.querySelector('[data-slot="sheet-footer"]') as HTMLElement;
}

describe("SheetFooter", () => {
  it("渲染带 data-slot 的容器并容纳 children", () => {
    render(() => <SheetFooter>操作区</SheetFooter>);

    expect(footer().tagName).toBe("DIV");
    expect(footer()).toHaveAttribute("data-slot", "sheet-footer");
    expect(footer()).toHaveTextContent("操作区");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <SheetFooter
        class="my-footer"
        classList={{ "is-stacked": true }}
        data-testid="footer-extra"
      />
    ));

    expect(footer()).toHaveClass("my-footer");
    expect(footer()).toHaveClass("is-stacked");
    expect(footer()).toHaveAttribute("data-testid", "footer-extra");
  });
});
