import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireActions } from "~/components/questionnaire/QuestionnaireActions";
import { QuestionnaireChoice } from "~/components/questionnaire/QuestionnaireChoice";
import { QuestionnaireChoices } from "~/components/questionnaire/QuestionnaireChoices";
import { QuestionnaireError } from "~/components/questionnaire/QuestionnaireError";
import { QuestionnaireInput } from "~/components/questionnaire/QuestionnaireInput";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";
import {
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSkip,
} from "~/components/questionnaire/QuestionnaireNavigation";
import { QuestionnaireProgress } from "~/components/questionnaire/QuestionnaireProgress";
import { QuestionnaireTitle } from "~/components/questionnaire/QuestionnaireTitle";
import { flush } from "~tests/components/questionnaire/test-utils";

/**
 * Questionnaire 整机：Root + Item + Choice/Input + Navigation 协作。
 * 这些场景只靠单组件或 hook 测试覆盖不到——提交/校验/焦点/FormData 的时序
 * 只有在真实 DOM 树里才成立。
 */
function form() {
  return document.querySelector(
    '[data-slot="questionnaire"]',
  ) as HTMLFormElement;
}

function nav(kind: "previous" | "skip" | "next") {
  return document.querySelector(
    `[data-slot="questionnaire-${kind}"]`,
  ) as HTMLButtonElement;
}

function items() {
  return [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="questionnaire-item"]',
    ),
  ];
}

function activeIndex() {
  return items().findIndex((item) => item.hasAttribute("data-active"));
}

function inputIn(index: number, selector = "input") {
  return items()[index]!.querySelector<HTMLInputElement>(selector);
}

/** 两道题：q1 单选必填、q2 多选 + 自由输入，带完整导航 */
async function renderTwoItems(
  options: {
    defaultItem?: string;
    onSubmit?: (event: SubmitEvent) => void;
    onReset?: (event: Event) => void;
  } = {},
) {
  render(() => (
    <Questionnaire
      defaultItem={options.defaultItem ?? "q1"}
      onSubmit={options.onSubmit}
      onReset={options.onReset}
    >
      <QuestionnaireProgress />
      <QuestionnaireItem name="q1" required>
        <QuestionnaireTitle>第一题</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
          <QuestionnaireChoice value="b">B</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="q2" multiple>
        <QuestionnaireTitle>第二题</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="x" defaultChecked>
            X
          </QuestionnaireChoice>
          <QuestionnaireChoice value="y">Y</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireInput aria-label="补充说明" />
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
      </QuestionnaireActions>
    </Questionnaire>
  ));
}

describe("Questionnaire 整机 - 提交与 FormData", () => {
  it("作答后 FormData 带上已选答案与自由输入", async () => {
    await renderTwoItems();

    fireEvent.click(inputIn(0, 'input[value="a"]')!);
    fireEvent.click(nav("next"));
    await flush();
    expect(activeIndex()).toBe(1);

    fireEvent.change(inputIn(1, '[data-slot="questionnaire-input"]')!, {
      target: { value: "补充内容" },
    });

    const data = new FormData(form());
    expect(data.get("q1")).toBe("a");
    expect(data.getAll("q2")).toEqual(["x", "补充内容"]);
  });

  it("必填题未作答时提交被阻止，错误可见并聚焦首个答案", async () => {
    const onSubmit = vi.fn();
    await renderTwoItems({ onSubmit });

    fireEvent.submit(form());
    await flush();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(items()[0]!).toHaveAttribute("aria-invalid", "true");
    const error = items()[0]!.querySelector(
      '[data-slot="questionnaire-error"]',
    );
    expect(error).not.toBeNull();
    expect(error).toHaveAttribute("role", "alert");
    expect(error as HTMLElement).not.toHaveAttribute("hidden");
    expect(document.activeElement).toBe(inputIn(0, 'input[value="a"]'));
  });

  it("提交时跳到最靠前的无效题目并把焦点移过去", async () => {
    const onSubmit = vi.fn();
    render(() => (
      <Questionnaire defaultItem="q2" onSubmit={onSubmit}>
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q2">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q3" required>
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));
    expect(activeIndex()).toBe(1);

    fireEvent.submit(form());
    await flush();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(activeIndex()).toBe(2);
    expect(items()[2]!).toHaveAttribute("aria-invalid", "true");
    expect(document.activeElement).toBe(inputIn(2, 'input[value="a"]'));
  });
});

describe("Questionnaire 整机 - 键盘导航", () => {
  it("最后一题按 Mod+Enter 请求提交表单", async () => {
    const onSubmit = vi.fn();
    await renderTwoItems({ onSubmit });
    // 先作答第一题再前进到最后一题，保证提交时整张表单有效
    fireEvent.click(inputIn(0, 'input[value="a"]')!);
    fireEvent.click(nav("next"));
    await flush();
    // jsdom 未实现 requestSubmit：补一个会真正派发 submit 的边界实现
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(function (this: HTMLFormElement) {
        this.dispatchEvent(new Event("submit", { cancelable: true }));
      });

    fireEvent.keyDown(form(), { key: "Enter", metaKey: true });

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    requestSubmit.mockRestore();
  });

  it("非最后一题按 Mod+Enter 前进到下一题", async () => {
    await renderTwoItems();
    fireEvent.click(inputIn(0, 'input[value="a"]')!);

    fireEvent.keyDown(form(), { key: "Enter", ctrlKey: true });
    await flush();

    expect(activeIndex()).toBe(1);
  });

  it("已作答时右箭头前进、左箭头回退（含导航后聚焦）", async () => {
    await renderTwoItems();
    fireEvent.click(inputIn(0, 'input[value="a"]')!);

    fireEvent.keyDown(form(), { key: "ArrowRight" });
    await flush();
    expect(activeIndex()).toBe(1);
    // focusItem 退到题目内第一个可聚焦控件（q2 是多选，第一个是 checkbox）
    expect(document.activeElement).toBe(inputIn(1, 'input[value="x"]'));

    fireEvent.keyDown(form(), { key: "ArrowLeft" });
    await flush();
    expect(activeIndex()).toBe(0);
    expect(document.activeElement).toBe(inputIn(0, 'input[value="a"]'));
  });

  it("未作答时右箭头停在原地", async () => {
    await renderTwoItems();

    fireEvent.keyDown(form(), { key: "ArrowRight" });
    await flush();

    expect(activeIndex()).toBe(0);
  });

  it("在已填写的答案控件上按 Enter 提交或前进", async () => {
    await renderTwoItems();
    const radio = inputIn(0, 'input[value="a"]')!;
    fireEvent.click(radio);

    fireEvent.keyDown(radio, { key: "Enter" });
    await flush();

    expect(activeIndex()).toBe(1);
  });
});

describe("Questionnaire 整机 - DOM 顺序变化", () => {
  it("题目换位后按新的文档顺序重排，进度跟随", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireProgress />
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q2">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
        <QuestionnaireItem name="q3">
          <QuestionnaireChoice value="a" defaultChecked>
            A
          </QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));
    expect(activeIndex()).toBe(0);
    expect(
      document.querySelector('[data-slot="questionnaire-progress"]'),
    ).toHaveTextContent("Question 1 of 3");

    const [q1, q2] = items();
    // 把前两题依次移到末尾（注册顺序不变，只有 DOM 顺序变了），
    // 排序需要在正向与反向两种比较下都算出新位置
    form().append(q1!);
    form().append(q2!);
    await flush();

    // 新 DOM 顺序：q3, q1, q2 —— q1 落到中间
    expect(activeIndex()).toBe(1);
    expect(
      document.querySelector('[data-slot="questionnaire-progress"]'),
    ).toHaveTextContent("Question 2 of 3");
    expect(
      document.querySelector('[data-slot="questionnaire-progress"]'),
    ).not.toHaveAttribute("data-last");
  });
});

describe("Questionnaire 整机 - 重置与跳过", () => {
  it("重置恢复默认选择", async () => {
    await renderTwoItems({ defaultItem: "q2" });
    const x = items()[1]!.querySelector<HTMLInputElement>('input[value="x"]')!;
    const y = items()[1]!.querySelector<HTMLInputElement>('input[value="y"]')!;
    expect(x.checked).toBe(true);

    fireEvent.click(y);
    expect(y.checked).toBe(true);
    expect(x.checked).toBe(true);

    fireEvent.reset(form());
    await flush();

    expect(x.checked).toBe(true);
    expect(y.checked).toBe(false);
    // reset 后回到 defaultItem（q2），不是第一题
    expect(activeIndex()).toBe(1);
  });

  it("onReset 调用 preventDefault 时不复位答案", async () => {
    const onReset = vi.fn((event: Event) => event.preventDefault());
    await renderTwoItems({ defaultItem: "q2", onReset });
    const x = items()[1]!.querySelector<HTMLInputElement>('input[value="x"]')!;
    const y = items()[1]!.querySelector<HTMLInputElement>('input[value="y"]')!;

    fireEvent.click(y);
    fireEvent.reset(form());
    await flush();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(y.checked).toBe(true);
    expect(x.checked).toBe(true);
  });

  it("跳过非必填题后该题答案不带 name（不参与 FormData）", async () => {
    await renderTwoItems({ defaultItem: "q2" });
    const x = items()[1]!.querySelector<HTMLInputElement>('input[value="x"]')!;
    expect(x).toHaveAttribute("name", "q2");

    fireEvent.click(nav("skip"));
    await flush();

    // 跳过最后一题后自动请求提交
    expect(items()[1]!).toHaveAttribute("data-status", "skipped");
    expect(x).not.toHaveAttribute("name");
  });
});

/**
 * 初始挂载顺序的回归（此前会整体颠倒）。
 *
 * `QuestionnaireItem` 在 ref 里注册，而 Solid 的 ref 早于节点插入文档，
 * 于是注册时 fieldset 还是分离节点；`compareDocumentOrder` 曾直接用
 * `compareDocumentPosition` 的结果排序，jsdom 对分离节点恒返回 FOLLOWING，
 * 导致三题问卷的初始激活项落到**最后一题**（aria-valuetext 变成 3 of 3）。
 * 现在分离节点返回 0（回退注册顺序），并在连上文档后再按真实 DOM 顺序收敛，
 * 因此下面这条用例**不需要**任何额外触发。
 */
describe("questionnaire 集成 - 初始挂载顺序", () => {
  it("默认激活第一题，进度是 1 of 3", async () => {
    const { container } = render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireProgress />
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
        <QuestionnaireItem name="q3" />
      </Questionnaire>
    ));
    await flush();

    expect(
      container
        .querySelector('[data-slot="questionnaire-progress"]')
        ?.getAttribute("aria-valuetext"),
    ).toBe("Question 1 of 3");
    expect(container.querySelector("[data-active]")).toHaveAttribute(
      "data-slot",
      "questionnaire-item",
    );
  });
});
