import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ComboboxEmpty } from "~/components/combobox/ComboboxEmpty/ComboboxEmpty";

describe("ComboboxEmpty", () => {
  it("渲染为 data-slot=combobox-empty 的容器并展示 children", () => {
    render(() => <ComboboxEmpty>没有匹配项</ComboboxEmpty>);

    const empty = screen.getByText("没有匹配项");
    expect(empty).toHaveAttribute("data-slot", "combobox-empty");
  });

  it("class 透传到容器", () => {
    render(() => <ComboboxEmpty class="my-empty" />);

    expect(document.querySelector('[data-slot="combobox-empty"]')).toHaveClass(
      "my-empty",
    );
  });
});
