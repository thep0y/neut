import { describe, expect, it, vi } from "vitest";
import type { QuestionnaireAnswerEntry } from "~/components/questionnaire/questionnaire.context";
import {
  focusItem,
  moveAnswerFocus,
} from "~/components/questionnaire/questionnaire.focus";

/** 造一个挂在文档里的控件（isConnected 为 true），并按需带上 name/type */
function control(
  tag: "input" | "textarea" = "input",
  attrs: Record<string, string> = {},
): HTMLInputElement | HTMLTextAreaElement {
  const el = document.createElement(tag) as
    | HTMLInputElement
    | HTMLTextAreaElement;
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  document.body.appendChild(el);
  return el;
}

function answer(
  element: HTMLElement,
  extra: Partial<QuestionnaireAnswerEntry> = {},
): QuestionnaireAnswerEntry {
  return {
    id: extra.id ?? `a-${Math.random()}`,
    element: element as QuestionnaireAnswerEntry["element"],
    type: "choice",
    disabled: false,
    ...extra,
  };
}

describe("focusItem", () => {
  it("作用域缺失时不报错", () => {
    expect(() => focusItem(undefined)).not.toThrow();
  });

  it("优先聚焦带 data-filled 与 name 的输入", () => {
    const scope = document.createElement("fieldset");
    document.body.appendChild(scope);
    const plain = control("input", { name: "other" });
    const filled = control("input", { name: "q1", "data-filled": "" });
    scope.append(plain, filled);

    focusItem(scope);

    expect(document.activeElement).toBe(filled);
  });

  it("没有已填输入时聚焦第一个可编辑控件（跳过 hidden）", () => {
    const scope = document.createElement("fieldset");
    document.body.appendChild(scope);
    const hidden = control("input", { type: "hidden" });
    const textarea = control("textarea");
    scope.append(hidden, textarea);

    focusItem(scope);

    expect(document.activeElement).toBe(textarea);
  });

  it("没有任何可编辑控件时聚焦作用域自身", () => {
    const scope = document.createElement("fieldset");
    scope.setAttribute("tabindex", "-1");
    document.body.appendChild(scope);

    focusItem(scope);

    expect(document.activeElement).toBe(scope);
  });
});

describe("moveAnswerFocus", () => {
  function setup(options: { disabledIndexes?: number[] } = {}) {
    const scope = document.createElement("fieldset");
    scope.setAttribute("tabindex", "-1");
    document.body.appendChild(scope);

    const elements = ["a", "b", "c"].map((id) =>
      control("input", { id: `el-${id}`, name: id }),
    );
    scope.append(...elements);
    const answers = elements.map((element, index) =>
      answer(element, {
        id: `ans-${index}`,
        disabled: options.disabledIndexes?.includes(index) ?? false,
      }),
    );

    return { scope, elements, answers };
  }

  it("没有可聚焦答案时返回 false", () => {
    const scope = document.createElement("fieldset");
    document.body.appendChild(scope);

    expect(
      moveAnswerFocus({
        scope,
        target: scope,
        direction: "next",
        answers: [],
      }),
    ).toBe(false);
  });

  it("从作用域出发：next 落到第一个、previous 落到最后一个", () => {
    const { scope, elements, answers } = setup();

    expect(
      moveAnswerFocus({ scope, target: scope, direction: "next", answers }),
    ).toBe(true);
    expect(document.activeElement).toBe(elements[0]);

    expect(
      moveAnswerFocus({ scope, target: scope, direction: "previous", answers }),
    ).toBe(true);
    expect(document.activeElement).toBe(elements[2]);
  });

  it("在中间元素上前后移动", () => {
    const { scope, elements, answers } = setup();

    moveAnswerFocus({
      scope,
      target: elements[1],
      direction: "next",
      answers,
    });
    expect(document.activeElement).toBe(elements[2]);

    moveAnswerFocus({
      scope,
      target: elements[1],
      direction: "previous",
      answers,
    });
    expect(document.activeElement).toBe(elements[0]);
  });

  it("首尾环形移动", () => {
    const { scope, elements, answers } = setup();

    moveAnswerFocus({
      scope,
      target: elements[2],
      direction: "next",
      answers,
    });
    expect(document.activeElement).toBe(elements[0]);

    moveAnswerFocus({
      scope,
      target: elements[0],
      direction: "previous",
      answers,
    });
    expect(document.activeElement).toBe(elements[2]);
  });

  it("目标既不在答案列表也不是作用域时返回 false", () => {
    const { scope, answers } = setup();
    const outsider = control("input");

    expect(
      moveAnswerFocus({ scope, target: outsider, direction: "next", answers }),
    ).toBe(false);
  });

  it("跳过被组件标记禁用的答案", () => {
    const { scope, elements, answers } = setup({ disabledIndexes: [1] });

    moveAnswerFocus({
      scope,
      target: elements[0],
      direction: "next",
      answers,
    });

    expect(document.activeElement).toBe(elements[2]);
  });

  it("跳过原生控件自身禁用的答案", () => {
    const { scope, elements, answers } = setup();
    (elements[1] as HTMLInputElement).disabled = true;

    moveAnswerFocus({
      scope,
      target: elements[0],
      direction: "next",
      answers,
    });

    expect(document.activeElement).toBe(elements[2]);
  });

  it("跳过已脱离文档的答案", () => {
    const { scope, elements, answers } = setup();
    elements[1].remove();

    moveAnswerFocus({
      scope,
      target: elements[0],
      direction: "next",
      answers,
    });

    expect(document.activeElement).toBe(elements[2]);
  });

  it("焦点在输入类控件上时不动（避免打字时被方向键带走）", () => {
    const { scope, answers } = setup();
    const textarea = control("textarea");
    scope.appendChild(textarea);
    textarea.focus();

    const moved = moveAnswerFocus({
      scope,
      target: textarea,
      direction: "next",
      answers: [answer(textarea, { id: "typing", type: "input" }), ...answers],
    });

    expect(moved).toBe(false);
    expect(document.activeElement).toBe(textarea);
  });

  it("唯一可聚焦答案就是当前元素时返回 false", () => {
    const { scope, elements, answers } = setup();

    expect(
      moveAnswerFocus({
        scope,
        target: elements[0],
        direction: "next",
        answers: [answers[0]!],
      }),
    ).toBe(false);
  });

  it("落到原生 radio 上时顺带点击它（radio 的箭头语义）", () => {
    const scope = document.createElement("fieldset");
    document.body.appendChild(scope);
    const radio = control("input", { type: "radio" }) as HTMLInputElement;
    scope.appendChild(radio);
    const clickSpy = vi.spyOn(radio, "click");

    moveAnswerFocus({
      scope,
      target: scope,
      direction: "next",
      answers: [answer(radio, { type: "choice" })],
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
