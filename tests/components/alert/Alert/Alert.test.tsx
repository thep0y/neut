import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Alert } from "~/components/alert/Alert/Alert";

/**
 * Alert：`role="alert"` 的容器，默认 `outline` 变体。
 * 变体只影响样式，因此这里断言的是「默认变体 / 显式 outline 与 destructive
 * 输出的类名互不相同」这一可观察差异（而不是把 cva 的整串 class 抄一遍）。
 */
function alertOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="alert"]') as HTMLElement;
}

describe("Alert - 结构与 ARIA", () => {
  it("渲染 div[data-slot=alert]，并带 role=alert", () => {
    const { container } = render(() => <Alert />);
    const element = alertOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("role")).toBe("alert");
  });

  it("默认与显式 outline 一致，destructive 带上破坏性样式", () => {
    const byDefault = alertOf(render(() => <Alert />).container);
    const outline = alertOf(
      render(() => <Alert variant="outline" />).container,
    );
    const destructive = alertOf(
      render(() => <Alert variant="destructive" />).container,
    );

    expect(outline.className).toBe(byDefault.className);
    expect(destructive.className).not.toBe(outline.className);
    expect(destructive.className).toContain("text-destructive");
    expect(outline.className).not.toContain("text-destructive");
  });
});

describe("Alert - class / classList / 属性透传", () => {
  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <Alert class="my-alert" classList={{ "is-danger": true }} />
    ));
    const element = alertOf(container);

    expect(element.className).toContain("my-alert");
    expect(element.className).toContain("is-danger");
  });

  it("透传其余属性、data-* 与 children", () => {
    const { container } = render(() => (
      <Alert id="a1" data-custom="yes" aria-label="提示">
        <span data-testid="child">内容</span>
      </Alert>
    ));
    const element = alertOf(container);

    expect(element.id).toBe("a1");
    expect(element.getAttribute("data-custom")).toBe("yes");
    expect(element.getAttribute("aria-label")).toBe("提示");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
