import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireChoices } from "~/components/questionnaire/QuestionnaireChoices";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * QuestionnaireChoices：选项容器，携带当前快捷键模式（`data-shortcuts`）供子项读取，
 * 并透传下方组件的属性。它依赖 QuestionnaireItem 上下文。
 */
function choices() {
  return document.querySelector(
    '[data-slot="questionnaire-choices"]',
  ) as HTMLElement;
}

function renderChoices(shortcuts?: "letters" | "numbers") {
  return render(() => (
    <Questionnaire shortcuts={shortcuts}>
      <QuestionnaireItem name="q1">
        <QuestionnaireChoices>
          <span>选项</span>
        </QuestionnaireChoices>
      </QuestionnaireItem>
    </Questionnaire>
  ));
}

describe("QuestionnaireChoices - 渲染与属性", () => {
  it("渲染 div 容器并承载子节点", () => {
    renderChoices();

    expect(choices().tagName).toBe("DIV");
    expect(choices()).toHaveTextContent("选项");
  });

  it("配置 shortcuts 时把模式写到 data-shortcuts", () => {
    renderChoices("letters");

    expect(choices()).toHaveAttribute("data-shortcuts", "letters");
  });

  it("未配置 shortcuts 时不输出 data-shortcuts", () => {
    renderChoices();

    expect(choices()).not.toHaveAttribute("data-shortcuts");
  });

  it("class 与 classList 都作用到元素上", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireChoices
            class="custom-choices"
            classList={{ "is-two-col": true }}
          />
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(choices().classList.contains("custom-choices")).toBe(true);
    expect(choices().classList.contains("is-two-col")).toBe(true);
  });

  it("脱离 QuestionnaireItem 渲染时抛出中文错误", () => {
    expect(() => render(() => <QuestionnaireChoices />)).toThrow(
      "必须渲染在 <QuestionnaireItem> 内部",
    );
  });
});
