import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SheetTitle } from "~/components/sheet/SheetTitle/SheetTitle";
import {
  dialogContentWrapper,
  fakeDialogContentContext,
} from "~tests/components/sheet/test-utils";

function title(): HTMLElement {
  return document.querySelector('[data-slot="sheet-title"]') as HTMLElement;
}

describe("SheetTitle", () => {
  it("渲染 h2 标题，带 data-slot 与唯一 id", () => {
    render(() => <SheetTitle>标题</SheetTitle>, {
      wrapper: dialogContentWrapper(fakeDialogContentContext()),
    });

    expect(title().tagName).toBe("H2");
    expect(title()).toHaveAttribute("data-slot", "sheet-title");
    expect(title()).toHaveTextContent("标题");
    expect(title().id).not.toBe("");
  });

  it("挂载时把自己的 id 注册给 DialogContentContext（供 aria-labelledby）", () => {
    const ctx = fakeDialogContentContext();
    render(() => <SheetTitle>标题</SheetTitle>, {
      wrapper: dialogContentWrapper(ctx),
    });

    expect(ctx.titleID()).toBe(title().id);
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(
      () => (
        <SheetTitle
          class="my-title"
          classList={{ "is-large": true }}
          data-testid="title-extra"
        >
          标题
        </SheetTitle>
      ),
      { wrapper: dialogContentWrapper(fakeDialogContentContext()) },
    );

    expect(title()).toHaveClass("my-title");
    expect(title()).toHaveClass("is-large");
    expect(title()).toHaveAttribute("data-testid", "title-extra");
  });

  it("脱离 DialogContent 渲染时抛出上下文缺失错误", () => {
    expect(() => render(() => <SheetTitle>标题</SheetTitle>)).toThrow(
      "useDialogContentContext 必须用在 <DialogContent> 内部",
    );
  });
});
