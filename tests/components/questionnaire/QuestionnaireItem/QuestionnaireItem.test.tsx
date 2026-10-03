import { fireEvent, render } from "@solidjs/testing-library";
import { For } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire } from "~/components/questionnaire/Questionnaire";
import { QuestionnaireChoice } from "~/components/questionnaire/QuestionnaireChoice";
import { QuestionnaireItem } from "~/components/questionnaire/QuestionnaireItem";

/**
 * QuestionnaireItem：单题目 `<fieldset>`。非激活时 `hidden` + `inert`，
 * 向 Root 注册命令式句柄；`data-*` 与 ARIA 驱动下游样式与无障碍。
 */
function items() {
  return [
    ...document.querySelectorAll<HTMLElement & { inert?: boolean }>(
      '[data-slot="questionnaire-item"]',
    ),
  ];
}

describe("QuestionnaireItem - 渲染与状态属性", () => {
  it("渲染 fieldset 并承载子节点", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1">
          <span>题目内容</span>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(items()[0]!.tagName).toBe("FIELDSET");
    expect(items()[0]).toHaveTextContent("题目内容");
  });

  it("激活项可聚焦（tabindex=-1）且不带 hidden/inert", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
      </Questionnaire>
    ));

    const [first, second] = items();
    expect(first).toHaveAttribute("data-active");
    expect(first).not.toHaveAttribute("hidden");
    expect(first.inert).toBe(false);
    expect(first).toHaveAttribute("tabindex", "-1");
    expect(second).not.toHaveAttribute("data-active");
  });

  it("非激活项 hidden + inert，且状态为 unanswered", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2" />
      </Questionnaire>
    ));

    const second = items()[1]!;
    expect(second).toHaveAttribute("hidden");
    // jsdom 不实现 inert 的 attribute 反射，Solid 写在 DOM 属性上（见报告）
    expect(second.inert).toBe(true);
    expect(second).toHaveAttribute("data-status", "unanswered");
  });

  it("required 通过 handle 参与校验：未作答时提交被阻止", async () => {
    const onSubmit = vi.fn();
    render(() => (
      <Questionnaire onSubmit={onSubmit}>
        <QuestionnaireItem name="q1" required>
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    fireEvent.submit(
      document.querySelector('[data-slot="questionnaire"]') as HTMLFormElement,
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(items()[0]).toHaveAttribute("aria-invalid", "true");
    expect(items()[0]).toHaveAttribute("data-invalid");
  });

  it("invalid 传入时标记 aria-invalid 与 data-invalid", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" invalid />
      </Questionnaire>
    ));

    expect(items()[0]).toHaveAttribute("aria-invalid", "true");
    expect(items()[0]).toHaveAttribute("data-invalid");
  });

  it("disabled 传入时禁用 fieldset 并标记 data-disabled", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" disabled />
      </Questionnaire>
    ));

    expect(items()[0]).toHaveProperty("disabled", true);
    expect(items()[0]).toHaveAttribute("data-disabled");
  });

  it("激活项带 aria-keyshortcuts（可提交 + 答案间移动）", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1">
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    const shortcuts = items()[0]!.getAttribute("aria-keyshortcuts") ?? "";
    expect(shortcuts).toContain("Meta+Enter Control+Enter");
    expect(shortcuts).toContain("ArrowUp ArrowDown");
  });

  it("非激活项不输出 aria-keyshortcuts", async () => {
    render(() => (
      <Questionnaire defaultItem="q1">
        <QuestionnaireItem name="q1" />
        <QuestionnaireItem name="q2">
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    expect(items()[1]).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("class 与 classList 都作用到 fieldset 上", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem
          name="q1"
          class="custom-item"
          classList={{ "is-raised": true }}
        />
      </Questionnaire>
    ));

    expect(items()[0]!.classList.contains("custom-item")).toBe(true);
    expect(items()[0]!.classList.contains("is-raised")).toBe(true);
  });

  it("透传 aria-labelledby 等其余属性", () => {
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" aria-labelledby="title-1" />
      </Questionnaire>
    ));

    expect(items()[0]).toHaveAttribute("aria-labelledby", "title-1");
  });

  it("脱离 Questionnaire 渲染时抛出中文错误", () => {
    expect(() => render(() => <QuestionnaireItem name="q1" />)).toThrow(
      "必须渲染在 <Questionnaire> 内部",
    );
  });
});

describe("QuestionnaireItem - 作答状态回调", () => {
  it("选择答案后 onStatusChange 收到 answered", () => {
    const onStatusChange = vi.fn();
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" onStatusChange={onStatusChange}>
          <For each={["a", "b"]}>
            {(value) => (
              <QuestionnaireChoice value={value}>{value}</QuestionnaireChoice>
            )}
          </For>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    fireEvent.click(
      document.querySelector('input[value="a"]') as HTMLInputElement,
    );

    expect(onStatusChange).toHaveBeenCalledWith("answered");
  });

  it("状态未变化时不回调", () => {
    const onStatusChange = vi.fn();
    render(() => (
      <Questionnaire>
        <QuestionnaireItem name="q1" onStatusChange={onStatusChange}>
          <QuestionnaireChoice value="a">A</QuestionnaireChoice>
        </QuestionnaireItem>
      </Questionnaire>
    ));

    // 仅挂载、未交互：状态仍是 unanswered，不应产生回调
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
