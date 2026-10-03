import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { QuestionnaireTitle } from "~/components/questionnaire/QuestionnaireTitle";

/**
 * QuestionnaireTitle：题目标题，默认渲染 `<legend>`（配合 fieldset），
 * 可用 `component` 多态换成 h2 / 自定义组件。这里断言用户可见的标签与 data-slot。
 */
function title() {
  return document.querySelector(
    '[data-slot="questionnaire-title"]',
  ) as HTMLElement;
}

describe("QuestionnaireTitle - 渲染", () => {
  it("默认渲染 legend 并带 data-slot 与文本", () => {
    render(() => <QuestionnaireTitle>你的目标是什么</QuestionnaireTitle>);

    expect(title().tagName).toBe("LEGEND");
    expect(title()).toHaveTextContent("你的目标是什么");
  });

  it("component 可换成 h2", () => {
    render(() => (
      <QuestionnaireTitle component="h2">章节标题</QuestionnaireTitle>
    ));

    expect(title().tagName).toBe("H2");
  });

  it("透传其余原生属性", () => {
    render(() => <QuestionnaireTitle id="t1" title="提示" />);

    expect(title()).toHaveAttribute("id", "t1");
    expect(title()).toHaveAttribute("title", "提示");
  });

  it("class 与 classList 都作用到元素上", () => {
    render(() => (
      <QuestionnaireTitle
        class="custom-title"
        classList={{ "is-on": true, "is-off": false }}
      />
    ));

    expect(title().classList.contains("custom-title")).toBe(true);
    expect(title().classList.contains("is-on")).toBe(true);
    expect(title().classList.contains("is-off")).toBe(false);
  });
});
