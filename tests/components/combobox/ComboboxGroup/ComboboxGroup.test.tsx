import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ComboboxGroup } from "~/components/combobox/ComboboxGroup/ComboboxGroup";

describe("ComboboxGroup", () => {
  it("渲染为 data-slot=combobox-group 的容器并展示 children", () => {
    render(() => (
      <ComboboxGroup>
        <span>水果</span>
      </ComboboxGroup>
    ));

    const group = document.querySelector('[data-slot="combobox-group"]');
    expect(
      screen.getByText("水果").closest('[data-slot="combobox-group"]'),
    ).toBe(group);
  });

  it("class 透传到容器", () => {
    render(() => <ComboboxGroup class="my-group" />);

    expect(document.querySelector('[data-slot="combobox-group"]')).toHaveClass(
      "my-group",
    );
  });
});
