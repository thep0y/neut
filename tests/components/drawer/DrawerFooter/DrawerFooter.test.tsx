import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { DrawerFooter } from "~/components/drawer/DrawerFooter/DrawerFooter";

function footer(): HTMLElement {
  return document.querySelector('[data-slot="drawer-footer"]') as HTMLElement;
}

describe("DrawerFooter", () => {
  it("渲染带 data-slot 的容器并容纳 children", () => {
    render(() => <DrawerFooter>按钮区</DrawerFooter>);

    expect(footer().tagName).toBe("DIV");
    expect(footer()).toHaveAttribute("data-slot", "drawer-footer");
    expect(footer()).toHaveTextContent("按钮区");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <DrawerFooter
        class="my-footer"
        classList={{ "is-sticky": true }}
        data-testid="footer-extra"
      />
    ));

    expect(footer()).toHaveClass("my-footer");
    expect(footer()).toHaveClass("is-sticky");
    expect(footer()).toHaveAttribute("data-testid", "footer-extra");
  });
});
