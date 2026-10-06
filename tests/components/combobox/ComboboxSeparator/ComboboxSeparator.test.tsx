import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ComboboxSeparator } from "~/components/combobox/ComboboxSeparator/ComboboxSeparator";

describe("ComboboxSeparator", () => {
  it("渲染为 data-slot=combobox-separator 的装饰元素", () => {
    render(() => <ComboboxSeparator />);

    const separator = document.querySelector(
      '[data-slot="combobox-separator"]',
    );
    expect(separator).not.toBeNull();
    expect(separator).toBeEmptyDOMElement();
  });

  it("class 透传到元素", () => {
    render(() => <ComboboxSeparator class="my-separator" />);

    expect(
      document.querySelector('[data-slot="combobox-separator"]'),
    ).toHaveClass("my-separator");
  });
});
