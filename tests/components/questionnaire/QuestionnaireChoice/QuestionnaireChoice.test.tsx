import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireChoice } from "~/components/questionnaire/QuestionnaireChoice";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * QuestionnaireChoice：固定选项 = 视觉隐藏的原生 radio/checkbox + 自绘指示器 +
 * 文字 + 快捷键徽标。选中由 Item 的选中集合驱动（受控时用 `checked`）。
 */
function label() {
  return document.querySelector(
    '[data-slot="questionnaire-choice"]',
  ) as HTMLElement;
}

function input() {
  return document.querySelector(
    '[data-slot="questionnaire-choice-input"]',
  ) as HTMLInputElement;
}

function indicator() {
  return document.querySelector(
    '[data-slot="questionnaire-choice-indicator"]',
  ) as HTMLElement;
}

function renderChoice(options: {
  choice?: {
    value?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (event: Event) => void;
  };
  item?: {
    multiple?: boolean;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
  };
  children?: JSX.Element;
}) {
  return render(() => (
    <Questionnaire>
      <QuestionnaireItem name="q1" {...options.item}>
        <QuestionnaireChoice
          value={options.choice?.value ?? "a"}
          checked={options.choice?.checked}
          defaultChecked={options.choice?.defaultChecked}
          disabled={options.choice?.disabled}
          onChange={options.choice?.onChange}
        >
          {options.children ?? "选项 A"}
        </QuestionnaireChoice>
      </QuestionnaireItem>
    </Questionnaire>
  ));
}

describe("QuestionnaireChoice - 单选与多选渲染", () => {
  it("默认渲染 radio，未选中时带 data-unchecked、无指示器圆点", () => {
    renderChoice({});

    expect(input().type).toBe("radio");
    expect(label()).toHaveAttribute("data-type", "radio");
    expect(label()).toHaveAttribute("data-unchecked");
    expect(label()).not.toHaveAttribute("data-checked");
    expect(
      document.querySelector(
        '[data-slot="questionnaire-choice-indicator-dot"]',
      ),
    ).toBeNull();
  });

  it("multiple 题目渲染 checkbox", () => {
    renderChoice({ item: { multiple: true } });

    expect(input().type).toBe("checkbox");
    expect(label()).toHaveAttribute("data-type", "checkbox");
  });

  it("文本渲染在 content 槽位中", () => {
    renderChoice({ children: <span>自定义内容</span> });

    expect(
      document.querySelector('[data-slot="questionnaire-choice-content"]'),
    ).toHaveTextContent("自定义内容");
    expect(label()).toHaveTextContent("自定义内容");
  });

  it("input 带 id、value、name，且视觉隐藏", () => {
    renderChoice({});

    expect(input()).toHaveAttribute("value", "a");
    expect(input()).toHaveAttribute("name", "q1");
    expect(input().id).not.toBe("");
    expect(input().classList.contains("opacity-0")).toBe(true);
    expect(input()).toHaveAttribute("data-slot", "questionnaire-choice-input");
  });
});

describe("QuestionnaireChoice - 选中态", () => {
  it("defaultChecked 让非受控选项初始选中（radio 显示圆点）", () => {
    renderChoice({ choice: { defaultChecked: true } });

    expect(input().checked).toBe(true);
    expect(label()).toHaveAttribute("data-checked");
    expect(label()).not.toHaveAttribute("data-unchecked");
    expect(
      document.querySelector(
        '[data-slot="questionnaire-choice-indicator-dot"]',
      ),
    ).not.toBeNull();
  });

  it("多选选中时指示器显示对勾而非圆点", () => {
    renderChoice({
      item: { multiple: true },
      choice: { defaultChecked: true },
    });

    expect(indicator().querySelector("svg")).not.toBeNull();
    expect(
      document.querySelector(
        '[data-slot="questionnaire-choice-indicator-dot"]',
      ),
    ).toBeNull();
  });

  it("受控 checked=true 时选中", () => {
    renderChoice({ choice: { checked: true } });

    expect(input().checked).toBe(true);
    expect(label()).toHaveAttribute("data-checked");
  });

  it("受控 checked=false 时不选中", () => {
    renderChoice({ choice: { checked: false, defaultChecked: true } });

    expect(input().checked).toBe(false);
    expect(label()).toHaveAttribute("data-unchecked");
  });

  it("点击未选中项后选中并回调 onChange", () => {
    const onChange = vi.fn();
    renderChoice({ choice: { onChange } });

    fireEvent.click(input());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input().checked).toBe(true);
    expect(label()).toHaveAttribute("data-checked");
  });
});

describe("QuestionnaireChoice - 禁用与无效态", () => {
  it("选项自身 disabled 时禁用 input 并标记 data-disabled", () => {
    renderChoice({ choice: { disabled: true } });

    expect(input().disabled).toBe(true);
    expect(label()).toHaveAttribute("data-disabled");
  });

  it("题目 disabled 时整个选项禁用", () => {
    renderChoice({ item: { disabled: true } });

    expect(input().disabled).toBe(true);
    expect(label()).toHaveAttribute("data-disabled");
  });

  it("题目 invalid 时 input 与选项都标记无效", () => {
    renderChoice({ item: { invalid: true } });

    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(label()).toHaveAttribute("data-invalid");
  });

  it("required 且单选、无文本框时 input 带原生 required", () => {
    renderChoice({ item: { required: true } });

    expect(input().required).toBe(true);
  });

  it("非必填或多选题不带原生 required", () => {
    renderChoice({ item: { multiple: true, required: true } });

    // 多选题无法用单选的原生 required 表达，交给组件校验
    expect(input().required).toBe(false);
  });
});

describe("QuestionnaireChoice - 快捷键", () => {
  function renderShortcuts(checked?: boolean) {
    return render(() => (
      <Questionnaire
        defaultItem="q1"
        shortcuts="letters"
        items={[
          {
            name: "q1",
            choices: [{ value: "a" }, { value: "b" }],
          },
        ]}
      >
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" checked={checked}>
            A
          </QuestionnaireChoice>
          <QuestionnaireChoice value="b">B</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));
  }

  it("按定义顺序分配字母并渲染徽标与 aria-keyshortcuts", () => {
    renderShortcuts();

    const badge = document.querySelector(
      '[data-slot="questionnaire-shortcut"]',
    ) as HTMLElement;
    expect(badge).toHaveTextContent("A");
    expect(label()).toHaveAttribute("data-shortcut", "A");
    expect(input()).toHaveAttribute("aria-keyshortcuts", "A");
  });

  it("选中后 aria-keyshortcuts 追加 Enter 提示", () => {
    renderShortcuts(true);

    expect(input()).toHaveAttribute("aria-keyshortcuts", "A Enter");
  });

  it("未配置 shortcuts 时不渲染徽标", () => {
    renderChoice({});

    expect(
      document.querySelector('[data-slot="questionnaire-shortcut"]'),
    ).toBeNull();
    expect(label()).not.toHaveAttribute("data-shortcut");
    expect(input()).not.toHaveAttribute("aria-keyshortcuts");
  });
});

describe("QuestionnaireChoice - 属性透传", () => {
  it("class 与 classList 都作用到 label 上", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice
            value="a"
            class="custom-choice"
            classList={{ "is-emphasized": true }}
          >
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(label().classList.contains("custom-choice")).toBe(true);
    expect(label().classList.contains("is-emphasized")).toBe(true);
  });

  it("脱离 QuestionnaireItem 渲染时抛出中文错误", () => {
    expect(() =>
      render(() => <QuestionnaireChoice value="a">A</QuestionnaireChoice>),
    ).toThrow("必须渲染在 <QuestionnaireItem> 内部");
  });
});
