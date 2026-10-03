import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertDialogHeader } from "~/components/alert-dialog/AlertDialogHeader/AlertDialogHeader";

function header(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-header"]',
  ) as HTMLElement;
}

describe("AlertDialogHeader", () => {
  it("渲染带 data-slot 的容器并容纳 children", () => {
    render(() => <AlertDialogHeader>标题区</AlertDialogHeader>);

    expect(header().tagName).toBe("DIV");
    expect(header()).toHaveAttribute("data-slot", "alert-dialog-header");
    expect(header()).toHaveTextContent("标题区");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <AlertDialogHeader
        class="my-header"
        classList={{ "is-tight": true }}
        data-testid="header-extra"
      />
    ));

    expect(header()).toHaveClass("my-header");
    expect(header()).toHaveClass("is-tight");
    expect(header()).toHaveAttribute("data-testid", "header-extra");
  });
});
