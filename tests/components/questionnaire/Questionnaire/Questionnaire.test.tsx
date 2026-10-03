import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";
import { QuestionnaireProgress } from "~/components/questionnaire/QuestionnaireProgress";

/**
 * Questionnaire 根：渲染 `<form>`，持有进度、激活项、校验与导航状态。
 * 这里只断言根组件自身的对外行为（form 属性、事件接线、class 合并、上下文）。
 */
function form() {
  return document.querySelector(
    '[data-slot="questionnaire"]',
  ) as HTMLFormElement;
}

describe("Questionnaire - 渲染与 form 属性", () => {
  it("渲染 form 元素并带 data-slot", () => {
    render(() => <Questionnaire />);

    expect(form().tagName).toBe("FORM");
  });

  it("默认 noValidate=true，关闭浏览器原生校验", () => {
    render(() => <Questionnaire />);

    expect(form().noValidate).toBe(true);
  });

  it("noValidate=false 时保留浏览器原生校验", () => {
    render(() => <Questionnaire noValidate={false} />);

    expect(form().noValidate).toBe(false);
  });

  it("shortcuts 通过 data-shortcuts 暴露给子组件样式", () => {
    render(() => <Questionnaire shortcuts="numbers" />);

    expect(form()).toHaveAttribute("data-shortcuts", "numbers");
  });

  it("未配置 shortcuts 时不输出 data-shortcuts", () => {
    render(() => <Questionnaire />);

    expect(form()).not.toHaveAttribute("data-shortcuts");
  });

  it("class 与 classList 都作用到 form 上", () => {
    render(() => (
      <Questionnaire class="custom-form" classList={{ "is-compact": true }} />
    ));

    expect(form().classList.contains("custom-form")).toBe(true);
    expect(form().classList.contains("is-compact")).toBe(true);
  });

  it("其余原生属性透传到 form", () => {
    render(() => <Questionnaire id="q-form" action="/submit" name="survey" />);

    expect(form()).toHaveAttribute("id", "q-form");
    expect(form()).toHaveAttribute("action", "/submit");
    expect(form()).toHaveAttribute("name", "survey");
  });

  it("children 渲染在 form 内部", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireProgress />
      </Questionnaire>
    ));

    expect(
      form().querySelector('[data-slot="questionnaire-progress"]'),
    ).not.toBeNull();
  });
});

describe("Questionnaire - 提交与重置事件", () => {
  it("没有无效题目时提交回调收到原生 SubmitEvent", () => {
    const onSubmit = vi.fn();
    render(() => <Questionnaire onSubmit={onSubmit} />);

    fireEvent.submit(form());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0]).toBeInstanceOf(Event);
  });

  it("重置时回调收到原生 Event", () => {
    const onReset = vi.fn();
    render(() => <Questionnaire onReset={onReset} />);

    fireEvent.reset(form());

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onReset.mock.calls[0]![0]).toBeInstanceOf(Event);
  });

  it("必填题未作答时提交被阻止，回调不触发", async () => {
    const onSubmit = vi.fn();
    render(() => (
      <Questionnaire onSubmit={onSubmit}>
        <QuestionnaireItem name="q1" required>
          <input type="text" />
        </QuestionnaireItem>
      </Questionnaire>
    ));

    fireEvent.submit(form());

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("受控 item 变化时通过 onItemChange 通知外部", async () => {
    const onItemChange = vi.fn();
    const [item, setItem] = createSignal("q1");
    render(() => (
      <Questionnaire item={item()} onItemChange={onItemChange}>
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
      </Questionnaire>
    ));

    setItem("q2");

    // 受控模式下由外部值驱动，内部不额外回调
    expect(onItemChange).not.toHaveBeenCalled();
    expect(
      document.querySelectorAll('[data-slot="questionnaire-item"]')[1],
    ).toHaveAttribute("data-active");
  });
});
