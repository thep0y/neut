import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireInput } from "~/components/questionnaire/QuestionnaireInput";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * QuestionnaireInput：自由作答输入。未选中时用 `form=""` 排除在表单之外、
 * 不带 name；选中（有默认值/受控值/用户输入）后才以 name 参与 FormData。
 */
function wrapper() {
  return document.querySelector(
    '[data-slot="questionnaire-input-wrapper"]',
  ) as HTMLElement;
}

function input() {
  return document.querySelector(
    '[data-slot="questionnaire-input"]',
  ) as HTMLInputElement;
}

function form() {
  return document.querySelector(
    '[data-slot="questionnaire"]',
  ) as HTMLFormElement;
}

function renderInput(options: {
  input?: {
    type?:
      | "text"
      | "number"
      | "email"
      | "password"
      | "date"
      | "search"
      | "tel"
      | "url";
    defaultValue?: string;
    value?: string;
    disabled?: boolean;
    onChange?: (event: Event) => void;
    classList?: Record<string, boolean>;
    class?: string;
    placeholder?: string;
  };
  item?: {
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
  };
  children?: JSX.Element;
}) {
  return render(() => (
    <Questionnaire>
      <QuestionnaireItem name="q1" {...options.item}>
        <QuestionnaireInput
          aria-label="自由作答"
          type={options.input?.type}
          defaultValue={options.input?.defaultValue}
          value={options.input?.value}
          disabled={options.input?.disabled}
          onChange={options.input?.onChange}
          class={options.input?.class}
          classList={options.input?.classList}
          placeholder={options.input?.placeholder}
        />
        {options.children}
      </QuestionnaireItem>
    </Questionnaire>
  ));
}

describe("QuestionnaireInput - 渲染与可访问性", () => {
  it("默认渲染 text 输入并带 wrapper/input 两个 data-slot", () => {
    renderInput({});

    expect(input().type).toBe("text");
    expect(wrapper().tagName).toBe("DIV");
    expect(input()).toHaveAttribute("aria-label", "自由作答");
    expect(input().id).not.toBe("");
  });

  it("type prop 覆盖默认类型", () => {
    renderInput({ input: { type: "email" } });

    expect(input().type).toBe("email");
  });

  it("透传 placeholder 等其余属性", () => {
    renderInput({ input: { placeholder: "请输入" } });

    expect(input()).toHaveAttribute("placeholder", "请输入");
  });
});

describe("QuestionnaireInput - 选中与 FormData 参与", () => {
  it("未作答时 data-empty、form='' 排除在表单外、无 name", () => {
    renderInput({});

    expect(input()).toHaveAttribute("data-empty");
    expect(input()).not.toHaveAttribute("data-filled");
    expect(input()).toHaveAttribute("form", "");
    expect(input()).not.toHaveAttribute("name");
    expect(input()).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("defaultValue 非空时初始即为已作答：data-filled、带 name、defaultValue 写入 DOM", () => {
    renderInput({ input: { defaultValue: "已有内容" } });

    expect(input()).toHaveAttribute("data-filled");
    expect(input()).not.toHaveAttribute("data-empty");
    expect(input()).toHaveAttribute("name", "q1");
    expect(input()).not.toHaveAttribute("form");
    expect(input().defaultValue).toBe("已有内容");
    expect(input().value).toBe("已有内容");
    expect(input()).toHaveAttribute("aria-keyshortcuts", "Enter");
  });

  it("空白 defaultValue 视为未作答", () => {
    renderInput({ input: { defaultValue: "   " } });

    expect(input()).toHaveAttribute("data-empty");
    expect(input()).not.toHaveAttribute("name");
  });

  it("受控 value 非空时显示值并参与表单", () => {
    renderInput({ input: { value: "受控值" } });

    expect(input().value).toBe("受控值");
    expect(input()).toHaveAttribute("data-filled");
    expect(input()).toHaveAttribute("name", "q1");
  });

  it("受控 value 为空串时不参与表单", () => {
    renderInput({ input: { value: "" } });

    expect(input().value).toBe("");
    expect(input()).toHaveAttribute("data-empty");
    expect(input()).not.toHaveAttribute("name");
  });
});

describe("QuestionnaireInput - 禁用、无效与交互", () => {
  it("题目 disabled 时禁用输入并标记 data-disabled", () => {
    renderInput({ item: { disabled: true } });

    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute("data-disabled");
    expect(input()).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("输入自身 disabled 时同样禁用", () => {
    renderInput({ input: { disabled: true } });

    expect(input().disabled).toBe(true);
    expect(input()).toHaveAttribute("data-disabled");
  });

  it("题目 invalid 时标记 aria-invalid 与 data-invalid", () => {
    renderInput({ item: { invalid: true } });

    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toHaveAttribute("data-invalid");
  });

  it("输入后变为已作答并回调 onChange", () => {
    const onChange = vi.fn();
    renderInput({ input: { onChange } });

    fireEvent.change(input(), { target: { value: "新的答案" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input()).toHaveAttribute("data-filled");
    expect(input()).toHaveAttribute("name", "q1");
  });

  it("清空输入后回到未作答", () => {
    renderInput({ input: { defaultValue: "初始" } });

    fireEvent.change(input(), { target: { value: "" } });

    expect(input()).toHaveAttribute("data-empty");
    expect(input()).not.toHaveAttribute("name");
  });
});

describe("QuestionnaireInput - 重置", () => {
  it("非受控：reset 后回到 defaultValue 的作答状态", () => {
    renderInput({ input: { defaultValue: "初始" } });
    expect(input()).toHaveAttribute("data-filled");

    fireEvent.change(input(), { target: { value: "" } });
    expect(input()).toHaveAttribute("data-empty");

    fireEvent.reset(form());

    expect(input()).toHaveAttribute("data-filled");
    expect(input()).toHaveAttribute("name", "q1");
  });

  it("受控：reset 不写内部填充状态，仍以外部值为准", () => {
    renderInput({ input: { value: "受控值" } });

    fireEvent.reset(form());

    expect(input().value).toBe("受控值");
    expect(input()).toHaveAttribute("data-filled");
  });
});

describe("QuestionnaireInput - 属性透传", () => {
  it("class 与 classList 都作用到 input 上", () => {
    renderInput({
      input: { class: "custom-input", classList: { "is-wide": true } },
    });

    expect(input().classList.contains("custom-input")).toBe(true);
    expect(input().classList.contains("is-wide")).toBe(true);
  });

  it("脱离 QuestionnaireItem 渲染时抛出中文错误", () => {
    expect(() => render(() => <QuestionnaireInput />)).toThrow(
      "必须渲染在 <QuestionnaireItem> 内部",
    );
  });
});
