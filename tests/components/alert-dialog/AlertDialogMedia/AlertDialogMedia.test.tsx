import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertDialogMedia } from "~/components/alert-dialog/AlertDialogMedia/AlertDialogMedia";

function media(): HTMLElement {
  return document.querySelector(
    '[data-slot="alert-dialog-media"]',
  ) as HTMLElement;
}

describe("AlertDialogMedia", () => {
  it("渲染带 data-slot 的媒体容器并容纳 children", () => {
    render(() => <AlertDialogMedia>图标</AlertDialogMedia>);

    expect(media().tagName).toBe("DIV");
    expect(media()).toHaveAttribute("data-slot", "alert-dialog-media");
    expect(media()).toHaveTextContent("图标");
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    render(() => (
      <AlertDialogMedia
        class="my-media"
        classList={{ "is-round": true }}
        data-testid="media-extra"
      />
    ));

    expect(media()).toHaveClass("my-media");
    expect(media()).toHaveClass("is-round");
    expect(media()).toHaveAttribute("data-testid", "media-extra");
  });
});
