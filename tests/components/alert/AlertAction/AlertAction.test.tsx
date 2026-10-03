import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AlertAction } from "~/components/alert/AlertAction/AlertAction";

/** AlertAction：`data-slot="alert-action"` 的 div 部件（Alert 右上角操作区）。 */
function actionOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="alert-action"]') as HTMLElement;
}

describe("AlertAction", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <AlertAction />);
    const element = actionOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("alert-action");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <AlertAction class="my-action" classList={{ "is-sticky": true }} />
    ));
    const element = actionOf(container);

    expect(element.className).toContain("my-action");
    expect(element.className).toContain("is-sticky");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <AlertAction id="act" data-custom="yes">
        <button type="button" data-testid="retry">
          重试
        </button>
      </AlertAction>
    ));
    const element = actionOf(container);

    expect(element.id).toBe("act");
    expect(element.getAttribute("data-custom")).toBe("yes");
    expect(container.querySelector('[data-testid="retry"]')).not.toBeNull();
  });
});
