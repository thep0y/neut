import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { InputGroupButton } from "~/components/input-group/InputGroupButton/InputGroupButton";

/**
 * InputGroupButton：输入框内的小按钮。默认 `type="button"` / `variant="ghost"` /
 * `size="xs"`；只有图标没有文字时走 iconSize 变体（正方形、无内边距）。
 */
describe("InputGroupButton", () => {
  it("默认渲染 button，size 映射到 data-size，variant 体现在类名上", () => {
    const { container } = render(() => (
      <InputGroupButton>点我</InputGroupButton>
    ));
    const button = container.querySelector<HTMLButtonElement>(
      '[data-slot="button"]',
    );

    expect(button?.tagName).toBe("BUTTON");
    expect(button?.type).toBe("button");
    expect(button?.getAttribute("data-size")).toBe("xs");
    // Button 不输出 data-variant，变体由类名表达
    expect(button?.className).toContain("hover:bg-muted");
  });

  it("有文字时用普通 size 变体（不套 iconSize）", () => {
    const { container } = render(() => (
      <InputGroupButton icon={<svg />}>文字</InputGroupButton>
    ));
    const className = container.querySelector<HTMLElement>(
      '[data-slot="button"]',
    )?.className;

    expect(className).toContain("px-1.5");
    expect(className).not.toContain("size-6");
  });

  it("只有图标时自动套 iconSize 变体", () => {
    const { container } = render(() => <InputGroupButton icon={<svg />} />);
    const className = container.querySelector<HTMLElement>(
      '[data-slot="button"]',
    )?.className;

    expect(className).toContain("size-6");
    expect(className).toContain("p-0");
  });

  it("size 可覆盖，并影响图标态的尺寸变体", () => {
    const withText = render(() => (
      <InputGroupButton size="sm">文字</InputGroupButton>
    ));
    expect(
      withText.container
        .querySelector<HTMLElement>('[data-slot="button"]')
        ?.getAttribute("data-size"),
    ).toBe("sm");

    const iconOnly = render(() => (
      <InputGroupButton size="sm" icon={<svg />} />
    ));
    const iconClassName = iconOnly.container.querySelector<HTMLElement>(
      '[data-slot="button"]',
    )?.className;
    expect(iconClassName).toContain("size-8");
  });

  it("variant 可覆盖，并透传 class / classList 与其余属性", () => {
    const { container } = render(() => (
      <InputGroupButton
        variant="outline"
        class="my-btn"
        classList={{ "is-active": true }}
        aria-label="复制"
        disabled
      />
    ));
    const button = container.querySelector<HTMLButtonElement>(
      '[data-slot="button"]',
    );

    expect(button?.className).toContain("border-border");
    expect(button?.className).toContain("my-btn");
    expect(button?.className).toContain("is-active");
    expect(button?.getAttribute("aria-label")).toBe("复制");
    expect(button?.disabled).toBe(true);
  });

  it("点击会调用调用方的 onClick", () => {
    let clicked = 0;
    const { container } = render(() => (
      <InputGroupButton onClick={() => (clicked += 1)}>点我</InputGroupButton>
    ));

    container.querySelector<HTMLButtonElement>('[data-slot="button"]')?.click();

    expect(clicked).toBe(1);
  });
});
