import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { QuestionnaireActions } from "~/components/questionnaire/QuestionnaireActions";

/**
 * QuestionnaireActions：纯布局容器，不读 context。断言 data-slot、children、
 * class/classList 与其余属性透传（它是公开的 BaseProps 组件）。
 */
function actions() {
  return document.querySelector(
    '[data-slot="questionnaire-actions"]',
  ) as HTMLElement;
}

describe("QuestionnaireActions - 渲染", () => {
  it("渲染 div 容器与 data-slot，并承载子节点", () => {
    render(() => (
      <QuestionnaireActions>
        <button type="button">下一题</button>
      </QuestionnaireActions>
    ));

    expect(actions().tagName).toBe("DIV");
    expect(actions().querySelector("button")).toHaveTextContent("下一题");
  });

  it("class 与 classList 都作用到元素上", () => {
    render(() => (
      <QuestionnaireActions
        class="custom-actions"
        classList={{ "is-sticky": true }}
      />
    ));

    expect(actions().classList.contains("custom-actions")).toBe(true);
    expect(actions().classList.contains("is-sticky")).toBe(true);
  });

  it("透传其余原生属性", () => {
    render(() => <QuestionnaireActions id="a1" data-x="1" />);

    expect(actions()).toHaveAttribute("id", "a1");
    expect(actions()).toHaveAttribute("data-x", "1");
  });
});
