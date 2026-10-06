import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Alert } from "~/components/alert/Alert/Alert";
import { AlertAction } from "~/components/alert/AlertAction/AlertAction";
import { AlertDescription } from "~/components/alert/AlertDescription/AlertDescription";
import { AlertTitle } from "~/components/alert/AlertTitle/AlertTitle";

/**
 * Alert 组合测试：Title / Description / Action 是同级部件，
 * 一起放进 Alert 容器时槽位顺序与文本内容都要保持可预测。
 */
function slotsIn(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-slot]")).map(
    (element) => element.getAttribute("data-slot") as string,
  );
}

function renderAlert(variant?: "outline" | "destructive") {
  return render(() => (
    <Alert variant={variant}>
      <AlertTitle>无法同步</AlertTitle>
      <AlertDescription>请检查网络后重试。</AlertDescription>
      <AlertAction>
        <button type="button">重试</button>
      </AlertAction>
    </Alert>
  ));
}

describe("Alert - 组合", () => {
  it("三个部件按声明顺序渲染在 alert 容器内，文本与按钮可见", () => {
    const { container } = renderAlert();

    expect(slotsIn(container)).toEqual([
      "alert",
      "alert-title",
      "alert-description",
      "alert-action",
    ]);
    expect(container.textContent).toContain("无法同步");
    expect(container.textContent).toContain("请检查网络后重试。");
    expect(
      container.querySelector('[data-slot="alert-action"] button'),
    ).not.toBeNull();
  });

  it("destructive 变体不改变组合结构，只换容器样式", () => {
    const { container } = renderAlert("destructive");
    const root = container.querySelector('[data-slot="alert"]') as HTMLElement;

    expect(root.getAttribute("role")).toBe("alert");
    expect(root.className).toContain("text-destructive");
    expect(slotsIn(container)).toEqual([
      "alert",
      "alert-title",
      "alert-description",
      "alert-action",
    ]);
  });

  it("classList 只作用于对应部件，不串到兄弟节点", () => {
    const { container } = render(() => (
      <Alert classList={{ "root-on": true }}>
        <AlertTitle classList={{ "title-on": true }}>标题</AlertTitle>
        <AlertDescription>描述</AlertDescription>
      </Alert>
    ));
    const root = container.querySelector('[data-slot="alert"]') as HTMLElement;
    const title = container.querySelector(
      '[data-slot="alert-title"]',
    ) as HTMLElement;
    const description = container.querySelector(
      '[data-slot="alert-description"]',
    ) as HTMLElement;

    expect(root.className).toContain("root-on");
    expect(root.className).not.toContain("title-on");
    expect(title.className).toContain("title-on");
    expect(description.className).not.toContain("title-on");
  });
});
