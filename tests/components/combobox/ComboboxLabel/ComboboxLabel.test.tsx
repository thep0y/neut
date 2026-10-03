import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ComboboxLabel } from "~/components/combobox/ComboboxLabel/ComboboxLabel";

describe("ComboboxLabel", () => {
  it("渲染为 data-slot=combobox-label 的容器并展示 children", () => {
    render(() => <ComboboxLabel>水果</ComboboxLabel>);

    const label = screen.getByText("水果");
    expect(label).toHaveAttribute("data-slot", "combobox-label");
  });

  it("class 透传到容器", () => {
    render(() => <ComboboxLabel class="my-label" />);

    expect(document.querySelector('[data-slot="combobox-label"]')).toHaveClass(
      "my-label",
    );
  });
});
