import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertTitle } from "~/components/alert/AlertTitle/AlertTitle";

/** AlertTitle：`data-slot="alert-title"` 的 div 部件。 */
function titleOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="alert-title"]') as HTMLElement;
}

describe("AlertTitle", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <AlertTitle />);
    const element = titleOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("alert-title");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <AlertTitle class="my-title" classList={{ "is-large": true }} />
    ));
    const element = titleOf(container);

    expect(element.className).toContain("my-title");
    expect(element.className).toContain("is-large");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <AlertTitle id="title" data-custom="yes">
        标题
      </AlertTitle>
    ));
    const element = titleOf(container);

    expect(element.id).toBe("title");
    expect(element.getAttribute("data-custom")).toBe("yes");
    expect(element.textContent).toBe("标题");
  });
});
