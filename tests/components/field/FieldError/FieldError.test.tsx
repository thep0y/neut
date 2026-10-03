import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldError } from "~/components/field/FieldError/FieldError";

/**
 * FieldError：`role="alert"` 的错误展示。三条规则：
 * 1. 有 children 时以 children 为准；
 * 2. 没有 children 且没有错误时不渲染；
 * 3. 多个错误时去重后渲染成列表，单个错误直接渲染文字。
 */
describe("FieldError - 渲染规则", () => {
  it("没有 children 也没有错误时不渲染", () => {
    const { container } = render(() => <FieldError />);

    expect(container.querySelector('[data-slot="field-error"]')).toBeNull();
  });

  it("errors 为空数组时也不渲染", () => {
    const { container } = render(() => <FieldError errors={[]} />);

    expect(container.querySelector('[data-slot="field-error"]')).toBeNull();
  });

  it("单个错误直接渲染文字，并带 role=alert", () => {
    const { container } = render(() => (
      <FieldError errors={[{ message: "必填" }]} />
    ));
    const element = container.querySelector('[data-slot="field-error"]')!;

    expect(element.getAttribute("role")).toBe("alert");
    expect(element.textContent).toBe("必填");
    expect(element.querySelector("ul")).toBeNull();
  });

  it("多个不同错误渲染成列表", () => {
    const { container } = render(() => (
      <FieldError errors={[{ message: "必填" }, { message: "太长" }]} />
    ));
    const items = container.querySelectorAll('[data-slot="field-error"] ul li');

    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toBe("必填");
    expect(items[1]?.textContent).toBe("太长");
  });

  it("重复 message 会被去重", () => {
    const { container } = render(() => (
      <FieldError
        errors={[{ message: "必填" }, { message: "必填" }, { message: "太长" }]}
      />
    ));

    expect(
      container.querySelectorAll('[data-slot="field-error"] ul li'),
    ).toHaveLength(2);
  });

  it("只有同一个 message 重复时按单条渲染（去重后长度为 1）", () => {
    const { container } = render(() => (
      <FieldError errors={[{ message: "必填" }, { message: "必填" }]} />
    ));
    const element = container.querySelector('[data-slot="field-error"]')!;

    expect(element.textContent).toBe("必填");
    expect(element.querySelector("ul")).toBeNull();
  });

  it("children 优先于 errors", () => {
    const { container } = render(() => (
      <FieldError errors={[{ message: "必填" }]}>
        <span data-testid="custom">自定义错误</span>
      </FieldError>
    ));

    expect(container.querySelector('[data-testid="custom"]')).not.toBeNull();
    expect(container.textContent).not.toContain("必填");
  });

  it("错误项没有 message 时列表里不渲染该项，但去重仍按 message 归并", () => {
    const { container } = render(() => (
      <FieldError errors={[{ message: "必填" }, {}, { message: "太长" }]} />
    ));
    const items = container.querySelectorAll('[data-slot="field-error"] ul li');

    // 三个 error 去重后是三条（message 分别为 "必填" / undefined / "太长"），
    // 其中没有 message 的不渲染成 li
    expect(items).toHaveLength(2);
    expect(container.textContent).toContain("必填");
    expect(container.textContent).toContain("太长");
  });
});

describe("FieldError - 样式与属性", () => {
  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <FieldError
        errors={[{ message: "必填" }]}
        class="my-error"
        classList={{ "is-loud": true }}
        id="err"
      />
    ));
    const element = container.querySelector('[data-slot="field-error"]')!;

    expect(element.className).toContain("my-error");
    expect(element.className).toContain("is-loud");
    expect(element.id).toBe("err");
  });
});
