import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireError } from "~/components/questionnaire/QuestionnaireError";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * QuestionnaireError：校验错误提示，默认 `<p>`。仅当题目 invalid 时可见
 * （`role="alert"` + 参与 aria-describedby），否则 `hidden`。
 */
function error() {
  return document.querySelector(
    '[data-slot="questionnaire-error"]',
  ) as HTMLElement;
}

function itemFieldset() {
  return document.querySelector(
    '[data-slot="questionnaire-item"]',
  ) as HTMLElement;
}

function renderError(
  itemProps: { required?: boolean; invalid?: boolean } = {},
) {
  return render(() => (
    <Questionnaire>
      <QuestionnaireItem
        name="q1"
        required={itemProps.required}
        invalid={itemProps.invalid}
      >
        <QuestionnaireError />
      </QuestionnaireItem>
    </Questionnaire>
  ));
}

describe("QuestionnaireError - 渲染与无效态", () => {
  it("题目无效时可见、role=alert、带 data-invalid 并登记到 aria-describedby", () => {
    renderError({ required: true, invalid: true });

    expect(error()).not.toHaveAttribute("hidden");
    expect(error()).toHaveAttribute("role", "alert");
    expect(error()).toHaveAttribute("data-invalid");
    expect(itemFieldset()).toHaveAttribute("aria-describedby", error().id);
  });

  it("题目有效时隐藏且不带 role/data-invalid", () => {
    renderError();

    expect(error()).toHaveAttribute("hidden");
    expect(error()).not.toHaveAttribute("role");
    expect(error()).not.toHaveAttribute("data-invalid");
  });

  it("必填题使用必填文案", () => {
    renderError({ required: true, invalid: true });

    expect(error()).toHaveTextContent("Choose an answer to continue.");
  });

  it("非必填题使用可跳过的文案", () => {
    renderError();

    expect(error()).toHaveTextContent(
      "Choose an answer or skip this question.",
    );
  });

  it("children 覆盖默认文案", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" invalid>
          <QuestionnaireError>请选择一个选项</QuestionnaireError>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(error()).toHaveTextContent("请选择一个选项");
  });

  it("显式 id 优先，自动生成 id 非空", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" invalid>
          <QuestionnaireError id="err-1" />
          <QuestionnaireError />
        </QuestionnaireItem>
      </Questionnaire>
    ));

    const [first, second] = document.querySelectorAll(
      '[data-slot="questionnaire-error"]',
    );
    expect(first!.id).toBe("err-1");
    expect(second!.id).not.toBe("");
  });

  it("component 可换成 div", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireError component="div" />
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(error().tagName).toBe("DIV");
  });

  it("class 与 classList 都作用到元素上", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireError
            class="custom-error"
            classList={{ "is-bold": true }}
          />
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(error().classList.contains("custom-error")).toBe(true);
    expect(error().classList.contains("is-bold")).toBe(true);
  });

  it("脱离 QuestionnaireItem 渲染时抛出中文错误", () => {
    expect(() => render(() => <QuestionnaireError />)).toThrow(
      "必须渲染在 <QuestionnaireItem> 内部",
    );
  });
});
