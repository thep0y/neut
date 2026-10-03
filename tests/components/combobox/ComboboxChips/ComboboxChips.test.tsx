import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Combobox } from "~/components/combobox/Combobox/Combobox";
import { ComboboxChips } from "~/components/combobox/ComboboxChips/ComboboxChips";
import { ComboboxChipsInput } from "~/components/combobox/ComboboxChipsInput/ComboboxChipsInput";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { bySlot, renderCombobox, stubWidth } from "../test-utils";

/**
 * `ComboboxChips`：chip 容器（`role=toolbar`），并充当浮层的锚点元素。
 */
describe("ComboboxChips", () => {
  it("渲染为 role=toolbar 的容器并挂载 chip", () => {
    renderCombobox({}, () => (
      <ComboboxChips>
        <span>apple</span>
      </ComboboxChips>
    ));

    const chips = bySlot("combobox-chips");
    expect(chips).not.toBeNull();
    expect(chips).toHaveAttribute("role", "toolbar");
    expect(chips).toHaveTextContent("apple");
  });

  it("class 透传到容器", () => {
    renderCombobox({}, () => <ComboboxChips class="my-chips" />);

    expect(bySlot("combobox-chips")).toHaveClass("my-chips");
  });

  it("作为锚点时浮层宽度跟随 chips 宽度", async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Combobox items={["apple"]} open={open()}>
        <ComboboxChips>
          <ComboboxChipsInput />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));

    // jsdom 不做布局，显式给锚点一个非零宽度再打开面板
    stubWidth(bySlot("combobox-chips") as HTMLElement, 240);
    setOpen(true);
    await Promise.resolve();

    const wrapper = bySlot("combobox-content")?.parentElement;
    expect(wrapper?.style.width).toBe("240px");
  });
});
