import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertDialogFooter } from "~/components/alert-dialog/AlertDialogFooter/AlertDialogFooter";

function footer(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-footer"]',
  ) as HTMLElement;
}

describe("AlertDialogFooter", () => {
  it("渲染带 data-slot 的容器并容纳 children", () => {
    render(() => <AlertDialogFooter>操作区</AlertDialogFooter>);

    expect(footer().tagName).toBe("DIV");
    expect(footer()).toHaveAttribute("data-slot", "alert-dialog-footer");
    expect(footer()).toHaveTextContent("操作区");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <AlertDialogFooter
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
