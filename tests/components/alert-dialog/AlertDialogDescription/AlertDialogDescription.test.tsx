import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertDialogDescription } from "~/components/alert-dialog/AlertDialogDescription/AlertDialogDescription";
import {
  dialogContentWrapper,
  fakeDialogContentContext,
} from "~tests/components/alert-dialog/test-utils";

function description(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-description"]',
  ) as HTMLElement;
}

describe("AlertDialogDescription", () => {
  it("渲染 p 描述，带 data-slot 与唯一 id", () => {
    render(() => <AlertDialogDescription>描述</AlertDialogDescription>, {
      wrapper: dialogContentWrapper(fakeDialogContentContext()),
    });

    expect(description().tagName).toBe("P");
    expect(description()).toHaveAttribute(
      "data-slot",
      "alert-dialog-description",
    );
    expect(description()).toHaveTextContent("描述");
    expect(description().id).not.toBe("");
  });

  it("挂载时把自己的 id 注册给 DialogContentContext（供 aria-describedby）", () => {
    const ctx = fakeDialogContentContext();
    render(() => <AlertDialogDescription>描述</AlertDialogDescription>, {
      wrapper: dialogContentWrapper(ctx),
    });

    expect(ctx.descriptionID()).toBe(description().id);
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(
      () => (
        <AlertDialogDescription
          class="my-description"
          classList={{ "is-muted": true }}
          data-testid="description-extra"
        >
          描述
        </AlertDialogDescription>
      ),
      { wrapper: dialogContentWrapper(fakeDialogContentContext()) },
    );

    expect(description()).toHaveClass("my-description");
    expect(description()).toHaveClass("is-muted");
    expect(description()).toHaveAttribute("data-testid", "description-extra");
  });

  it("脱离 DialogContent 渲染时抛出上下文缺失错误", () => {
    expect(() =>
      render(() => <AlertDialogDescription>描述</AlertDialogDescription>),
    ).toThrow("useDialogContentContext 必须用在 <DialogContent> 内部");
  });
});
