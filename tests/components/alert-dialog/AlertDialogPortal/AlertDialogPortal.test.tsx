import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertDialogPortal } from "~/components/alert-dialog/AlertDialogPortal/AlertDialogPortal";

function portal(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-portal"]',
  ) as HTMLElement;
}

describe("AlertDialogPortal", () => {
  it("把内容渲染到 document.body（真正的 Portal），带 alert 的 data-slot", () => {
    const { container } = render(() => (
      <AlertDialogPortal>浮层内容</AlertDialogPortal>
    ));

    expect(portal()).toBeInTheDocument();
    expect(portal()).toHaveAttribute("data-slot", "alert-dialog-portal");
    expect(portal()).toHaveTextContent("浮层内容");
    // Portal 的内容不在 render 容器里
    expect(container.contains(portal())).toBe(false);
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <AlertDialogPortal
        class="my-portal"
        classList={{ "is-fixed": true }}
        data-testid="portal-extra"
      />
    ));

    expect(portal()).toHaveClass("my-portal");
    expect(portal()).toHaveClass("is-fixed");
    expect(portal()).toHaveAttribute("data-testid", "portal-extra");
  });
});
