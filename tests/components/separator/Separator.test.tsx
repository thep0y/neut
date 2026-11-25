import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Separator } from "~/components/separator";

describe("Separator", () => {
  it("默认为水平 separator，并暴露 aria-orientation", () => {
    const { container } = render(() => <Separator />);
    const separator = container.querySelector(
      '[data-slot="separator"]',
    ) as HTMLElement;

    expect(separator).toHaveAttribute("role", "separator");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
  });

  it("vertical 同时更新 aria 与 data 属性", () => {
    const { container } = render(() => <Separator orientation="vertical" />);
    const separator = container.querySelector(
      '[data-slot="separator"]',
    ) as HTMLElement;

    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).toHaveAttribute("data-vertical", "");
  });

  it("decorative 时不进入无障碍树", () => {
    const { container } = render(() => <Separator decorative />);
    const separator = container.querySelector(
      '[data-slot="separator"]',
    ) as HTMLElement;

    expect(separator).toHaveAttribute("role", "none");
    expect(separator).not.toHaveAttribute("aria-orientation");
  });

  it("合并 class / classList", () => {
    const { container } = render(() => (
      <Separator class="my-separator" classList={{ extra: true }} />
    ));
    const separator = container.querySelector(
      '[data-slot="separator"]',
    ) as HTMLElement;

    expect(separator).toHaveClass("my-separator", "extra");
  });
});
