import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireActions } from "~/components/questionnaire/QuestionnaireActions";
import { QuestionnaireChoice } from "~/components/questionnaire/QuestionnaireChoice";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";
import {
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireSubmit,
} from "~/components/questionnaire/QuestionnaireNavigation";

/**
 * 导航按钮：可见性由 Root 的进度/必填状态推导，点击触发上一题/跳过/下一题；
 * 隐藏时 `hidden + inert`、`aria-hidden`、`tabIndex=-1`，可见的 Next/Submit 暴露
 * `aria-keyshortcuts="Enter"`。
 */
function nav(kind: "previous" | "skip" | "next" | "submit") {
  return document.querySelector(
    `[data-slot="questionnaire-${kind}"]`,
  ) as HTMLButtonElement;
}

/** 当前激活题在 DOM 中的下标（0 = q1，1 = q2） */
function activeIndex() {
  const list = [
    ...document.querySelectorAll('[data-slot="questionnaire-item"]'),
  ];
  return list.findIndex((item) => item.hasAttribute("data-active"));
}

async function renderNav(
  options: { defaultItem?: string; required?: boolean } = {},
) {
  render(() => (
    <Questionnaire defaultItem={options.defaultItem ?? "q1"}>
      <QuestionnaireItem name="q1" required={options.required}>
        <QuestionnaireChoice value="a" defaultChecked>
          A1
        </QuestionnaireChoice>
      </QuestionnaireItem>
      <QuestionnaireItem name="q2" required={options.required}>
        <QuestionnaireChoice value="a" defaultChecked>
          A2
        </QuestionnaireChoice>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>
  ));
}

describe("QuestionnaireNavigation - 可见性与 ARIA", () => {
  it("第一题：显示 Next/Skip，隐藏 Previous/Submit", async () => {
    await renderNav();

    expect(nav("previous")).toHaveAttribute("data-hidden");
    expect(nav("previous")).toHaveAttribute("hidden");
    expect(nav("previous")).toHaveAttribute("aria-hidden", "true");
    expect(nav("previous")).toHaveAttribute("tabindex", "-1");
    expect(nav("previous")).toHaveTextContent("Previous");

    expect(nav("next")).toHaveAttribute("data-visible");
    expect(nav("next")).not.toHaveAttribute("hidden");
    expect(nav("next")).toHaveAttribute("tabindex", "0");
    expect(nav("next")).toHaveAttribute("aria-keyshortcuts", "Enter");
    expect(nav("next")).toHaveTextContent("Next");

    expect(nav("skip")).toHaveAttribute("data-visible");
    expect(nav("skip")).toHaveTextContent("Skip");

    expect(nav("submit")).toHaveAttribute("data-hidden");
    expect(nav("submit")).toHaveAttribute("hidden");
    expect(nav("submit")).toHaveTextContent("Submit");
  });

  it("最后一题：显示 Previous/Submit，隐藏 Next", async () => {
    await renderNav({ defaultItem: "q2" });

    expect(nav("previous")).toHaveAttribute("data-visible");
    expect(nav("previous")).toHaveAttribute("tabindex", "0");
    expect(nav("previous")).not.toHaveAttribute("aria-keyshortcuts");

    expect(nav("next")).toHaveAttribute("data-hidden");
    expect(nav("next")).not.toHaveAttribute("aria-keyshortcuts");

    expect(nav("submit")).toHaveAttribute("data-visible");
    expect(nav("submit")).toHaveAttribute("aria-keyshortcuts", "Enter");
  });

  it("submit 按钮的原生 type 是 submit，其余是 button", async () => {
    await renderNav();

    expect(nav("submit")).toHaveAttribute("type", "submit");
    expect(nav("next")).toHaveAttribute("type", "button");
    expect(nav("previous")).toHaveAttribute("type", "button");
    expect(nav("skip")).toHaveAttribute("type", "button");
  });

  it("必填题隐藏 Skip", async () => {
    await renderNav({ required: true });

    expect(nav("skip")).toHaveAttribute("data-hidden");
    expect(nav("skip")).toHaveAttribute("hidden");
  });

  it("Previous 左对齐、其余右对齐", async () => {
    await renderNav({ defaultItem: "q2" });

    expect(nav("previous").classList.contains("justify-self-start")).toBe(true);
    expect(nav("next").classList.contains("justify-self-end")).toBe(true);
    expect(nav("next").classList.contains("justify-self-start")).toBe(false);
  });

  it("children 覆盖默认标签", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireNext>继续</QuestionnaireNext>
      </Questionnaire>
    ));

    expect(nav("next")).toHaveTextContent("继续");
  });

  it("显示的 Next 被 disabled 时不暴露 Enter 快捷键", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q2" />
        <QuestionnaireNext disabled />
      </Questionnaire>
    ));

    expect(nav("next")).toHaveAttribute("data-visible");
    expect(nav("next")).toHaveAttribute("data-disabled");
    expect(nav("next")).toHaveProperty("disabled", true);
    expect(nav("next")).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("显式 variant 与 type 覆盖默认值", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireNext variant="ghost" type="button">
          继续
        </QuestionnaireNext>
      </Questionnaire>
    ));

    expect(nav("next")).toHaveAttribute("type", "button");
  });
});

describe("QuestionnaireNavigation - 导航行为", () => {
  it("点击 Next 前进到第二题", async () => {
    await renderNav();
    expect(activeIndex()).toBe(0);

    fireEvent.click(nav("next"));

    expect(activeIndex()).toBe(1);
  });

  it("点击 Previous 回到第一题", async () => {
    await renderNav({ defaultItem: "q2" });

    fireEvent.click(nav("previous"));

    expect(activeIndex()).toBe(0);
  });

  it("点击 Skip 跳过当前题并前进", async () => {
    await renderNav();

    fireEvent.click(nav("skip"));

    expect(activeIndex()).toBe(1);
  });

  it("用户 onClick 先执行；preventDefault 后不再导航", async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q2" />
        <QuestionnaireNext onClick={onClick} />
      </Questionnaire>
    ));

    fireEvent.click(nav("next"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(activeIndex()).toBe(0);
  });

  it("onClick 传 [handler, data] 数组时按数组形式调用", async () => {
    const handler = vi.fn();
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnairePrevious onClick={[handler, { id: 1 }] as never} />
      </Questionnaire>
    ));

    // Previous 在第一题不可见，但事件依然可触发（data-visible=false）
    fireEvent.click(nav("previous"));

    expect(handler).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({ type: "click" }),
    );
  });

  it("Submit 点击只调用用户回调，不触发组件导航", async () => {
    const onClick = vi.fn();
    render(() => (
      <Questionnaire defaultItem="q2">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A1
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q2">
          <QuestionnaireChoice value="a" defaultChecked>
            A2
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireSubmit type="button" onClick={onClick} />
      </Questionnaire>
    ));

    fireEvent.click(nav("submit"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(activeIndex()).toBe(1);
  });
});
