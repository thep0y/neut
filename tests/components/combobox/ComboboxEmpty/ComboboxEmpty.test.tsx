import { screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ComboboxEmpty } from "~/components/combobox/ComboboxEmpty/ComboboxEmpty";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { comboboxInput, renderCombobox } from "../test-utils";

describe("ComboboxEmpty", () => {
  it("没有匹配项时渲染 data-slot 容器并展示 children", () => {
    renderCombobox({ open: true, items: [] }, () => (
      <ComboboxEmpty>没有匹配项</ComboboxEmpty>
    ));

    const empty = screen.getByText("没有匹配项");
    expect(empty).toHaveAttribute("data-slot", "combobox-empty");
  });

  it("有匹配项时不渲染", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <ComboboxEmpty>没有匹配项</ComboboxEmpty>
    ));

    expect(screen.queryByText("没有匹配项")).toBeNull();
  });

  it("输入过滤到 0 项后出现", async () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <>
        <ComboboxInput />
        <ComboboxEmpty>没有匹配项</ComboboxEmpty>
      </>
    ));
    const user = userEvent.setup();

    await user.type(comboboxInput(), "zzz");

    expect(screen.getByText("没有匹配项")).toBeInTheDocument();
  });

  it("class 透传到容器", () => {
    renderCombobox({ open: true, items: [] }, () => (
      <ComboboxEmpty class="my-empty" />
    ));

    expect(document.querySelector('[data-slot="combobox-empty"]')).toHaveClass(
      "my-empty",
    );
  });
});
