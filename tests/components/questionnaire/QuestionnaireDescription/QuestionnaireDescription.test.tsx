import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireDescription } from "~/components/questionnaire/QuestionnaireDescription";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * QuestionnaireDescription：题目描述，默认 `<p>`，id 注册给 QuestionnaireItem，
 * 通过 fieldset 的 `aria-describedby` 暴露给辅助技术。
 */
function description() {
  return document.querySelector(
    '[data-slot="questionnaire-description"]',
  ) as HTMLElement;
}

function itemFieldset() {
  return document.querySelector(
    '[data-slot="questionnaire-item"]',
  ) as HTMLElement;
}

describe("QuestionnaireDescription - 渲染与注册", () => {
  it("默认渲染 p，带 data-slot 与文本", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireDescription>说明文字</QuestionnaireDescription>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(description().tagName).toBe("P");
    expect(description()).toHaveTextContent("说明文字");
  });

  it("自动生成 id 并登记到 fieldset 的 aria-describedby", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireDescription>说明</QuestionnaireDescription>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    const id = description().id;
    expect(id).not.toBe("");
    expect(itemFieldset()).toHaveAttribute("aria-describedby", id);
  });

  it("显式 id 优先于自动生成", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireDescription id="desc-1">说明</QuestionnaireDescription>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(description().id).toBe("desc-1");
    expect(itemFieldset()).toHaveAttribute("aria-describedby", "desc-1");
  });

  it("多个描述以空格合并到 aria-describedby", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireDescription id="d1">一</QuestionnaireDescription>
          <QuestionnaireDescription id="d2">二</QuestionnaireDescription>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(itemFieldset()).toHaveAttribute("aria-describedby", "d1 d2");
  });

  it("component 可换成 span", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireDescription component="span">
            说明
          </QuestionnaireDescription>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(description().tagName).toBe("SPAN");
  });

  it("class 与 classList 都作用到元素上", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireDescription
            class="custom-desc"
            classList={{ "is-muted": true }}
          />
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(description().classList.contains("custom-desc")).toBe(true);
    expect(description().classList.contains("is-muted")).toBe(true);
  });

  it("脱离 QuestionnaireItem 渲染时抛出中文错误", () => {
    expect(() => render(() => <QuestionnaireDescription />)).toThrow(
      "必须渲染在 <QuestionnaireItem> 内部",
    );
  });
});
