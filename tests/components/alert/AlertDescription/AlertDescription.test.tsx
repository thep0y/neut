import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertDescription } from "~/components/alert/AlertDescription/AlertDescription";

/** AlertDescription：`data-slot="alert-description"` 的 div 部件。 */
function descriptionOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="alert-description"]',
  ) as HTMLElement;
}

describe("AlertDescription", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <AlertDescription />);
    const element = descriptionOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("alert-description");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <AlertDescription class="my-desc" classList={{ "is-muted": true }} />
    ));
    const element = descriptionOf(container);

    expect(element.className).toContain("my-desc");
    expect(element.className).toContain("is-muted");
  });

  it("透传其余属性与 children（含段落）", () => {
    const { container } = render(() => (
      <AlertDescription id="desc" data-custom="yes">
        <p data-testid="line">第一行</p>
      </AlertDescription>
    ));
    const element = descriptionOf(container);

    expect(element.id).toBe("desc");
    expect(element.getAttribute("data-custom")).toBe("yes");
    expect(container.querySelector('[data-testid="line"]')?.textContent).toBe(
      "第一行",
    );
  });
});
