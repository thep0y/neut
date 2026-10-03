import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";
import { QuestionnaireProgress } from "~/components/questionnaire/QuestionnaireProgress";

/**
 * QuestionnaireProgress：`role="progressbar"` 的进度条。默认文本 "Question X of Y"，
 * `children` 传函数可拿到 render state 自绘。断言 ARIA 数值与 data-* 状态。
 */
function progress() {
  return document.querySelector(
    '[data-slot="questionnaire-progress"]',
  ) as HTMLElement;
}

describe("QuestionnaireProgress - 渲染与 ARIA", () => {
  it("默认显示 Question X of Y，并同步 ARIA 数值", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireProgress />
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
      </Questionnaire>
    ));

    expect(progress()).toHaveAttribute("role", "progressbar");
    expect(progress()).toHaveAttribute("aria-label", "Questionnaire progress");
    expect(progress()).toHaveAttribute("aria-live", "polite");
    expect(progress()).toHaveAttribute("aria-valuemin", "1");
    expect(progress()).toHaveAttribute("aria-valuemax", "2");
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
    expect(progress()).toHaveAttribute("aria-valuetext", "Question 1 of 2");
    expect(progress()).toHaveTextContent("Question 1 of 2");
    expect(progress()).toHaveAttribute("data-current", "1");
    expect(progress()).toHaveAttribute("data-total", "2");
    expect(progress()).toHaveAttribute("data-first");
    expect(progress()).not.toHaveAttribute("data-last");
  });

  it("没有题目时省略进度数值（aria-valuenow/text 不输出）", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireProgress />
      </Questionnaire>
    ));

    expect(progress()).not.toHaveAttribute("aria-valuenow");
    expect(progress()).not.toHaveAttribute("aria-valuemin");
    expect(progress()).not.toHaveAttribute("aria-valuemax");
    expect(progress()).not.toHaveAttribute("aria-valuetext");
    expect(progress()).toHaveAttribute("data-total", "0");
    expect(progress()).toHaveAttribute("data-current", "0");
    expect(progress().textContent).toBe("");
  });

  it("最后一题时带 data-last、不带 data-first", async () => {
    render(() => (
      <Questionnaire defaultItem="q2">
        <QuestionnaireProgress />
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
      </Questionnaire>
    ));

    expect(progress()).toHaveAttribute("data-last");
    expect(progress()).not.toHaveAttribute("data-first");
    expect(progress()).toHaveAttribute("aria-valuenow", "2");
    expect(progress()).toHaveAttribute("aria-valuetext", "Question 2 of 2");
  });

  it("children 传元素时覆盖默认文本", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireProgress>
          <span>自定义进度</span>
        </QuestionnaireProgress>
      </Questionnaire>
    ));

    expect(progress()).toHaveTextContent("自定义进度");
  });

  it("children 传函数时收到 render state 可自绘", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireProgress>
          {(state) => <span>{`${state.current}/${state.total}`}</span>}
        </QuestionnaireProgress>
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
      </Questionnaire>
    ));

    expect(progress()).toHaveTextContent("1/2");
  });

  it("class 与 classList 都作用到元素上", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireProgress
          class="custom-progress"
          classList={{ "is-large": true }}
        />
      </Questionnaire>
    ));

    expect(progress().classList.contains("custom-progress")).toBe(true);
    expect(progress().classList.contains("is-large")).toBe(true);
  });

  it("脱离 Questionnaire 渲染时抛出中文错误", () => {
    expect(() => render(() => <QuestionnaireProgress />)).toThrow(
      "必须渲染在 <Questionnaire> 内部",
    );
  });
});
